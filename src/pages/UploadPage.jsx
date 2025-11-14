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
import { FaFileExcel, FaArrowRight, FaKeyboard, FaPlus, FaRegHandPaper } from 'react-icons/fa';
import { RadioGroup } from '@headlessui/react';
import { read, utils } from 'xlsx'; // Kept for the new parser

// --- Import ALL Components ---
import FileDropzone from '../components/upload/FileDropzone';
import ManualDataEntry from '../components/upload/ManualDataEntry';
import ColumnMapper from '../components/upload/ColumnMapper';
import AnalysisSelector from '../components/upload/AnalysisSelector';
import OcrDropzone from '../components/upload/OcrDropzone';
import PageLoader from '../components/common/PageLoader'; // For loading state

// --- Helper Components from your "previous" file ---

// Step 0: Method Selection
const UploadMethodSelector = ({ onSelect }) => {
  const [dataMethod, setDataMethod] = useState('file');
  const [formulaMethod, setFormulaMethod] = useState('inbuilt');

  return (
    <div className="w-full space-y-6 rounded-lg bg-white p-6 shadow">
      {/* Data Input Method */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800">
          1. How do you want to add data?
        </h3>
        <RadioGroup value={dataMethod} onChange={setDataMethod} className="mt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RadioGroup.Option
              value="file"
              className={({ checked }) =>
                `cursor-pointer rounded-lg border p-4 ${
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
                `cursor-pointer rounded-lg border p-4 ${
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
            
            <RadioGroup.Option
              value="ocr"
              className={({ checked }) =>
                `cursor-pointer rounded-lg border p-4 ${
                  checked
                    ? 'border-primary bg-primary-light'
                    : 'border-secondary-DEFAULT'
                }`
              }
            >
              <div className="flex items-center">
                <FaRegHandPaper className="h-6 w-6 text-primary-dark" />
                <span className="ml-3 font-medium">Handwritten</span>
              </div>
              <p className="text-sm text-secondary-dark mt-1">Scan from an image</p>
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
                `cursor-pointer rounded-lg border p-4 ${
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
                `cursor-pointer rounded-lg border p-4 ${
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
    <form onSubmit={handleSubmit} className="w-full space-y-4 rounded-lg bg-white p-6 shadow">
      <h3 className="text-lg font-semibold text-gray-800">Save Your Experiment</h3>
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-secondary-DEFAULT shadow-sm focus:border-primary focus:ring-primary"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border-secondary-DEFAULT shadow-sm focus:border-primary focus:ring-primary"
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
  const [file, setFile] = useState(null); // This will hold the file to be uploaded (Excel or Image)
  const [originalData, setOriginalData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMap, setColumnMap] = useState({});
  const [processedData, setProcessedData] = useState(null);
  const [ocrData, setOcrData] = useState(null); // Holds data from OCR
  const [error, setError] = useState(null); // For parsing errors
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { mutate, isLoading } = useMutation({
    mutationFn: async ({ title, description, isPublic }) => {
      if (!processedData || !user) throw new Error('Missing data or user');

      let storagePath = null;
      if (file) {
        // Use 'uploads' for Excel, 'images' for OCR
        const fileType = uploadOptions.dataMethod === 'ocr' ? 'images' : 'uploads';
        storagePath = `${fileType}/${user.uid}/${uuidv4()}-${file.name}`;
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
        storagePath,
        createdAt: serverTimestamp(),
        headers: headers, // Save the final flattened headers
        data: processedData.data, // Save the final processed data
        analysis: processedData.analysis,
      });

      return docRef.id;
    },
    onSuccess: (docId) => {
      navigate(`/dashboard?uploadSuccess=true`);
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

  // --- THIS IS THE "UNION" LOGIC ---
  // This function now uses the new "Smart Parser"
  const handleFileAccepted = (acceptedFiles) => {
    const file = acceptedFiles[0];
    setFile(file); // Save file for later upload
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Use 'header: 1' to get an array of arrays, don't skip blank rows
        const jsonData = utils.sheet_to_json(worksheet, { header: 1, defval: null });
        
        if (jsonData.length < 3) {
          throw new Error("File must contain at least 2 header rows and 1 data row.");
        }

        // --- Smart Parser Logic Starts ---
        const headerRow = jsonData[0];
        const unitRow = jsonData[1];
        const dataRows = jsonData.slice(2);

        const flattenedHeaders = [];
        let currentMainHeader = '';

        headerRow.forEach((header, index) => {
          // A main header is defined (not null and not 'Unnamed...')
          const mainHeader = (header !== null && !String(header).startsWith('Unnamed')) 
                            ? String(header).trim() 
                            : currentMainHeader;
          
          if (mainHeader) {
              currentMainHeader = mainHeader;
          }
          
          const subHeader = unitRow[index] ? String(unitRow[index]).trim() : '';

          let finalHeader = mainHeader;
          // Combine if subHeader exists and is not the same as the main header
          if (subHeader && subHeader.toLowerCase() !== mainHeader.toLowerCase()) {
            finalHeader = `${mainHeader} (${subHeader})`;
          }
          
          // Use index as a fallback for truly empty header columns
          flattenedHeaders.push(finalHeader || `Column_${index + 1}`);
        });
        // --- Smart Parser Logic Ends ---

        // --- Data Cleaning Logic Starts ---
        const parsedData = dataRows.map(row => {
          const rowObject = {};
          flattenedHeaders.forEach((header, index) => {
            let value = row[index];
            
            if (value === undefined || value === null) {
              rowObject[header] = null;
            } else if (typeof value === 'number') {
              rowObject[header] = value;
            } else if (typeof value === 'string') {
              let trimmedValue = value.trim();
              if (trimmedValue === '') {
                rowObject[header] = null;
              } else if (!isNaN(Number(trimmedValue))) {
                rowObject[header] = Number(trimmedValue);
              } else {
                rowObject[header] = value;
              }
            } else {
              rowObject[header] = value;
            }
          });
          return rowObject;
        });
        // --- Data Cleaning Logic Ends ---

        setOriginalData(parsedData);
        setHeaders(flattenedHeaders); // Use the new smart headers
        setStep(2); // Go to ColumnMapper
        
      } catch (parseError) {
        console.error("Error parsing file:", parseError);
        setError(`Error processing file: ${parseError.message}`);
        setStep(0); // Go back to start
      }
    };
    reader.readAsArrayBuffer(file); // Use ArrayBuffer
  };
  
  // This logic (OCR) is from your "previous" file and is preserved
  const handleOcrComplete = ({ data, columns, imageFile }) => {
    setFile(imageFile); // Save image file for later upload
    setOcrData({ data, columns });
    setUploadOptions(prev => ({ ...prev, dataMethod: 'manual' }));
  };

  // This logic (Manual Entry) is from your "previous" file and is preserved
  const handleManualDataSubmitted = ({ data, columns }) => {
    const jsonData = data.map(row => {
      let rowObj = {};
      columns.forEach((col, index) => {
        const val = row[index] || '';
        const numVal = parseFloat(val);
        rowObject[col.name] = !isNaN(numVal) && val.trim() !== '' ? numVal : val;
      });
      return rowObj;
    });

    setOriginalData(jsonData);
    setHeaders(columns.map(c => c.name));
    setOcrData(null); 
    setStep(2); 
  };

  // This logic is from your "previous" file and is preserved
  const handleMapComplete = (mapping) => {
    setColumnMap(mapping);
    setStep(3);
  };

  // This logic is from your "previous" file and is preserved
  const handleAnalysisComplete = (selectedCalculations) => {
    const calcIds = selectedCalculations.map(c => c.id);
    const { newData, newHeaders } = runAnalysis(originalData, columnMap, selectedCalculations);
    
    setProcessedData({
      data: newData,
      analysis: {
        selectedIds: calcIds, 
        newHeaders,
        originalHeaders: headers,
        map: columnMap,
        calculations: selectedCalculations.map(({id, name, formula}) => ({id, name, formula}))
      }
    });
    setHeaders(Object.keys(newData[0])); // Update headers to include new calculated ones
    setStep(4);
  };
  
  const handleSave = (details) => {
    mutate(details);
  };
  
  const resetFlow = () => {
    setStep(0);
    setFile(null);
    setOriginalData([]);
    setHeaders([]);
    setColumnMap({});
    setProcessedData(null);
    setOcrData(null);
    setError(null); // Clear errors
  }

  return (
    <div className="container mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">
        Create New Experiment
      </h1>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="text-sm text-red-700 mt-2">{error}</p>
        </div>
      )}

      <div className="relative rounded-lg">
        {step === 0 && (
          <UploadMethodSelector onSelect={handleOptionsSelected} />
        )}
        
        {step === 1 && uploadOptions.dataMethod === 'file' && (
          <FileDropzone onFileAccepted={handleFileAccepted} />
        )}
        
        {step === 1 && uploadOptions.dataMethod === 'manual' && (
          <ManualDataEntry 
            onSubmit={handleManualDataSubmitted}
            initialColumns={ocrData?.columns}
            initialData={ocrData?.data}
          />
        )}

        {step === 1 && uploadOptions.dataMethod === 'ocr' && (
          <OcrDropzone onOcrComplete={handleOcrComplete} />
        )}

        {step === 2 && (
          <ColumnMapper
            detectedHeaders={headers}
            availableCalculations={AVAILABLE_CALCULATIONS} 
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
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-white/70">
            <PageLoader /> 
            <p className="mt-2 text-lg font-semibold text-primary-dark">
              Saving Experiment...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}