import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useMutation } from '@tanstack/react-query';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuthStore } from '../hooks/useAuthStore';
import { AVAILABLE_CALCULATIONS, runAnalysis } from '../lib/analysis';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { FaFileExcel, FaArrowRight, FaKeyboard, FaPlus } from 'react-icons/fa';
import { RadioGroup } from '@headlessui/react';
import { read, utils } from 'xlsx';

// --- Import New Components ---
import FileDropzone from '../components/upload/FileDropzone';
import ManualDataEntry from '../components/upload/ManualDataEntry';
import ColumnMapper from '../components/upload/ColumnMapper';
import AnalysisSelector from '../components/upload/AnalysisSelector';

// --- Helper Components ---

// Step 0: Method Selection
const UploadMethodSelector = ({ onSelect }) => {
  const [dataMethod, setDataMethod] = useState('file');
  const [formulaMethod, setFormulaMethod] = useState('inbuilt');

  return (
    <div className="w-full space-y-6  bg-white p-6 shadow">
      {/* Data Input Method */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800">
          1. How do you want to add data?
        </h3>
        <RadioGroup value={dataMethod} onChange={setDataMethod} className="mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RadioGroup.Option
              value="file"
              className={({ checked }) =>
                `cursor-pointer  border p-4 ${
                  checked
                    ? 'border-primary bg-primary-light'
                    : 'border-secondary-DEFAULT'
                }`
              }
            >
              <div className="flex items-center">
                <FaFileExcel className="h-6 w-6 text-primary-dark" />
                <span className="ml-3 font-medium">Upload File</span>
              </div>
              <p className="text-sm text-secondary-dark mt-1">.xlsx, .xls, or .csv</p>
            </RadioGroup.Option>
            <RadioGroup.Option
              value="manual"
              className={({ checked }) =>
                `cursor-pointer  border p-4 ${
                  checked
                    ? 'border-primary bg-primary-light'
                    : 'border-secondary-DEFAULT'
                }`
              }
            >
              <div className="flex items-center">
                <FaKeyboard className="h-6 w-6 text-primary-dark" />
                <span className="ml-3 font-medium">Enter Manually</span>
              </div>
              <p className="text-sm text-secondary-dark mt-1">Input data in a table</p>
            </RadioGroup.Option>
          </div>
        </RadioGroup>
      </div>

      {/* Formula Method */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800">
          2. How do you want to calculate?
        </h3>
        <RadioGroup
          value={formulaMethod}
          onChange={setFormulaMethod}
          className="mt-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RadioGroup.Option
              value="inbuilt"
              className={({ checked }) =>
                `cursor-pointer  border p-4 ${
                  checked
                    ? 'border-primary bg-primary-light'
                    : 'border-secondary-DEFAULT'
                }`
              }
            >
              <div className="flex items-center">
                <span className="ml-3 font-medium">Use In-built Formulas</span>
              </div>
              <p className="text-sm text-secondary-dark mt-1">e.g., Enthalpy, Energy</p>
            </RadioGroup.Option>
            <RadioGroup.Option
              value="custom"
              className={({ checked }) =>
                `cursor-pointer  border p-4 ${
                  checked
                    ? 'border-primary bg-primary-light'
                    : 'border-secondary-DEFAULT'
                }`
              }
            >
              <div className="flex items-center">
                <FaPlus className="h-5 w-5 text-primary-dark" />
                <span className="ml-3 font-medium">Define Custom Formula</span>
              </div>
              <p className="text-sm text-secondary-dark mt-1">e.g., density = mass / vol</p>
            </RadioGroup.Option>
          </div>
        </RadioGroup>
      </div>

      <Button
        type="button"
        className="w-full justify-center"
        onClick={() => onSelect(dataMethod, formulaMethod)}
      >
        Continue <FaArrowRight className="ml-2" />
      </Button>
    </div>
  );
};

// Step 4: Finalize and Save
const FinalizeExperiment = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, description, isPublic });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4  bg-white p-6 shadow">
      <h3 className="text-lg font-semibold text-gray-800">Save Your Experiment</h3>
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full  border-secondary-DEFAULT shadow-sm focus:border-primary focus:ring-primary"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full  border-secondary-DEFAULT shadow-sm focus:border-primary focus:ring-primary"
        />
      </div>
      <div className="flex items-start">
        <input
          id="isPublic"
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 rounded border-secondary-DEFAULT text-primary focus:ring-primary"
        />
        <label htmlFor="isPublic" className="ml-3 block text-sm font-medium text-gray-700">
          Make this experiment public?
          <span className="block font-normal text-secondary-dark">Allows other users to view and "Extract" this data.</span>
        </label>
      </div>
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Experiment</Button>
      </div>
    </form>
  )
}

// --- Main Page Component ---

export default function UploadPage() {
  const [step, setStep] = useState(0); // 0 = chooser, 1 = input, 2 = map, 3 = analyze, 4 = save
  const [uploadOptions, setUploadOptions] = useState({
    dataMethod: 'file',
    formulaMethod: 'inbuilt',
  });
  const [file, setFile] = useState(null);
  const [originalData, setOriginalData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMap, setColumnMap] = useState({});
  const [processedData, setProcessedData] = useState(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { mutate, isLoading } = useMutation({
    mutationFn: async ({ title, description, isPublic }) => {
      if (!processedData || !user) throw new Error('Missing data or user');

      let storagePath = null;

      // Only upload file if one was provided
      if (uploadOptions.dataMethod === 'file' && file) {
        storagePath = `uploads/${user.uid}/${uuidv4()}-${file.name}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);
      }

      const authorName = user.displayName || user.email;

      const docRef = await addDoc(collection(db, 'experiments'), {
        userId: user.uid,
        authorEmail: user.email,
        authorName: authorName,
        title,
        description,
        isPublic,
        storagePath, // Null if manual
        createdAt: serverTimestamp(),
        headers: Object.keys(processedData.data[0]),
        data: processedData.data,
        analysis: processedData.analysis,
      });

      return docRef.id;
    },
    onSuccess: (docId) => {
      navigate(`/experiment/${docId}`);
    },
    onError: (error) => {
      console.error('Error saving experiment:', error);
      alert('Error saving experiment. Check console for details.');
    },
  });

  const handleOptionsSelected = (dataMethod, formulaMethod) => {
    setUploadOptions({ dataMethod, formulaMethod });
    setStep(1); // Go to data input step
  };

  const handleFileAccepted = (acceptedFiles) => {
    const file = acceptedFiles[0];
    setFile(file);
    const reader = new FileReader();

    reader.onload = (event) => {
      const data = event.target.result;
      const workbook = read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = utils.sheet_to_json(worksheet);

      setOriginalData(json);
      setHeaders(Object.keys(json[0]));
      setStep(2); // Go to ColumnMapper
    };

    reader.readAsBinaryString(file);
  };
  
  const handleManualDataSubmitted = ({ data, columns }) => {
    // Convert array of strings to array of objects
    const jsonData = data.map(row => {
      let rowObj = {};
      columns.forEach((col, index) => {
        // Attempt to convert to number
        const val = row[index];
        const numVal = parseFloat(val);
        rowObj[col.name] = isNaN(numVal) ? val : numVal;
      });
      return rowObj;
    });

    setOriginalData(jsonData);
    setHeaders(columns.map(c => c.name));
    setStep(2); // Go to ColumnMapper
  };

  const handleMapComplete = (mapping) => {
    setColumnMap(mapping);
    setStep(3);
  };

  const handleAnalysisComplete = (selectedCalculations) => {
    // 'selectedCalculations' is now an array of calculation objects
    const calcIds = selectedCalculations.map(c => c.id);
    const { newData, newHeaders } = runAnalysis(originalData, columnMap, selectedCalculations);
    
    setProcessedData({
      data: newData,
      analysis: {
        selectedIds: calcIds, // Store IDs for easy lookup
        newHeaders,
        originalHeaders: headers,
        map: columnMap,
        // Store custom formula details
        calculations: selectedCalculations.map(({id, name, formula, func, ...rest}) => ({id, name, formula}))
      }
    });
    setStep(4);
  };
  
  const handleSave = (details) => {
    mutate(details);
  };
  
  const resetFlow = () => {
    setStep(0); // Go back to chooser
    setFile(null);
    setOriginalData([]);
    setHeaders([]);
    setColumnMap({});
    setProcessedData(null);
  }

  return (
    <div className="container mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">
        Create New Experiment
      </h1>

      <div className="relative ">
        {/* Render current step */}
        {step === 0 && (
          <UploadMethodSelector onSelect={handleOptionsSelected} />
        )}
        
        {step === 1 && uploadOptions.dataMethod === 'file' && (
          <FileDropzone onFileAccepted={handleFileAccepted} />
        )}
        
        {step === 1 && uploadOptions.dataMethod === 'manual' && (
          <ManualDataEntry onSubmit={handleManualDataSubmitted} />
        )}

        {step === 2 && (
          <ColumnMapper
            detectedHeaders={headers}
            availableCalculations={AVAILABLE_CALCULATIONS} // Pass this down
            onMapComplete={handleMapComplete}
          />
        )}
        {step === 3 && (
          <AnalysisSelector
            columnMap={columnMap}
            availableCalculations={AVAILABLE_CALCULATIONS}
            allowCustomFormulas={uploadOptions.formulaMethod === 'custom'}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}
        {step === 4 && (
          <FinalizeExperiment onSave={handleSave} onCancel={resetFlow} />
        )}

        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center  bg-white/70">
            <Spinner />
            <p className="mt-2 text-lg font-semibold text-primary-dark">
              Saving Experiment...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}