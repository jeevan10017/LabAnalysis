import React, { useState, useMemo, Fragment, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthStore } from '../hooks/useAuthStore';
import { useLocation } from 'react-router-dom'; 
import PageLoader from '../components/common/PageLoader';
import { FaChevronDown, FaChartArea, FaBrain, FaEdit, FaPlus } from 'react-icons/fa';
import { Listbox, Tab } from '@headlessui/react';
import Button from '../components/common/Button';
import HeatmapChart from '../components/visualization/HeatmapChart';
import VariableSelector from '../components/upload/VariableSelector';
import ModelResultDisplay from '../components/visualization/ModelResultDisplay';
import { Modal } from '../components/common/Modal';
import ManualDataEntry from '../components/upload/ManualDataEntry';
import Spinner from '../components/common/Spinner';
import { useLayoutStore } from '../hooks/useLayoutStore';
// Import UploadPage to use inside the modal
import UploadPage from './UploadPage'; 

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

// ... (Select component remains the same) ...
const Select = ({ label, value, onChange, options, valueKey = "id" }) => (
  <Listbox value={value} onChange={onChange}>
    <div className="relative">
      <Listbox.Label className="block text-sm font-medium text-gray-700">{label}</Listbox.Label>
      <Listbox.Button className="relative mt-1 w-full cursor-default  border border-secondary-DEFAULT bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm">
        <span className="block truncate">{value ? value.name : 'Select an option'}</span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <FaChevronDown className="h-5 w-5 text-gray-400" />
        </span>
      </Listbox.Button>
      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto  bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
        {options.map(option => (
          <Listbox.Option
            key={option[valueKey]}
            as={Fragment}
            value={option}
          >
            {({ active, selected }) => (
              <li
                className={`relative cursor-default select-none py-2 pl-4 pr-4 ${
                  active ? 'bg-primary-light text-primary-dark' : 'text-gray-900'
                }`}
              >
                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                  {option.name}
                </span>
              </li>
            )}
          </Listbox.Option>
        ))}
      </Listbox.Options>
    </div>
  </Listbox>
);

// ... (HeatmapVariableList remains the same) ...
const HeatmapVariableList = ({ options, selected, onChange }) => {
    // ... code from previous response ...
    const handleToggle = (optionName) => {
        if (selected.includes(optionName)) {
          onChange(selected.filter(item => item !== optionName));
        } else {
          onChange([...selected, optionName]);
        }
      };
    
      const handleSelectAll = () => {
        if (selected.length === options.length) {
          onChange([]);
        } else {
          onChange(options.map(o => o.name));
        }
      };
    
      return (
        <div className="bg-white p-4  border border-secondary-DEFAULT shadow-sm h-full flex flex-col">
          <div className="flex justify-between items-center mb-2 border-b border-secondary-light pb-2">
            <h3 className="text-sm font-bold text-gray-700">Select Variables</h3>
            <button 
              onClick={handleSelectAll}
              className="text-xs text-primary hover:text-primary-dark underline"
            >
              {selected.length === options.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 pr-2 max-h-[450px]">
            {options.map((option) => (
              <div key={option.id} className="flex items-center hover:bg-gray-50 p-1 rounded">
                <input
                  id={`hm-${option.id}`}
                  type="checkbox"
                  checked={selected.includes(option.name)}
                  onChange={() => handleToggle(option.name)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor={`hm-${option.id}`} className="ml-3 block text-xs text-gray-700 cursor-pointer w-full">
                  {option.name}
                </label>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-secondary-light text-xs text-gray-500">
            {selected.length} variables selected
          </div>
        </div>
      );
};

// ... (runMultiVariableModel remains the same) ...
const runMultiVariableModel = async (experimentData, independentVars, dependentVars) => {
    // ... code from previous response ...
    await new Promise(res => setTimeout(res, 1500));
    const coefficients = {};
    dependentVars.forEach(depVar => {
      coefficients[depVar] = {};
      independentVars.forEach(indepVar => {
        coefficients[depVar][indepVar] = Math.random() * 5 - 2.5; 
      });
      coefficients[depVar]['Intercept'] = Math.random() * 10;
    });
    const predictions = experimentData.map(row => {
      const actual = {};
      const predicted = {};
      dependentVars.forEach(depVar => {
        actual[depVar] = row[depVar];
        predicted[depVar] = row[depVar] * (0.8 + Math.random() * 0.4); 
      });
      return { actual, predicted };
    });
    return {
      r_squared: 0.75 + Math.random() * 0.2,
      coefficients: coefficients,
      predictions: predictions,
    };
};

export default function SelectModulePage() {
  const { user } = useAuthStore();
  const location = useLocation(); 
  const queryClient = useQueryClient();
  
  const { setIsCollapsed } = useLayoutStore();
  useEffect(() => {
    setIsCollapsed(true); 
  }, [setIsCollapsed]);
  
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [isEditDataOpen, setIsEditDataOpen] = useState(false); 
  const [isCreateOpen, setIsCreateOpen] = useState(false); // <-- NEW STATE FOR CREATE MODAL
  
  const [heatmapSelectedVars, setHeatmapSelectedVars] = useState([]);
  
  const [modelResults, setModelResults] = useState(null);
  const [modelVars, setModelVars] = useState({ independentVars: [], dependentVars: [] });

  const { data: experiments, isLoading: isLoadingExperiments } = useQuery({
    queryKey: ['myExperiments', user?.uid],
    queryFn: async () => {
      const q = query(collection(db, 'experiments'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), name: doc.data().title }));
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (experiments && location.state?.experimentId && !selectedExperiment) {
        const targetExp = experiments.find(e => e.id === location.state.experimentId);
        if (targetExp) {
            setSelectedExperiment(targetExp);
        }
    }
  }, [experiments, location.state, selectedExperiment]);

  const { mutate: runModel, isLoading: isModelRunning } = useMutation({
    mutationFn: (variables) => 
      runMultiVariableModel(variables.data, variables.independent, variables.dependent),
    onSuccess: (results) => {
      setModelResults(results);
    },
    onError: (err) => alert(`Error: ${err.message}`)
  });

  const { mutate: updateData, isLoading: isSavingData } = useMutation({
    mutationFn: async ({ newData, newHeaders }) => {
      const jsonData = newData.map(row => {
        let rowObj = {};
        newHeaders.forEach((header, index) => {
          const val = row[index];
          const numVal = parseFloat(val);
          rowObj[header.name] = !isNaN(numVal) && String(val).trim() !== '' ? numVal : val;
        });
        return rowObj;
      });
      
      const docRef = doc(db, 'experiments', selectedExperiment.id);
      await updateDoc(docRef, { 
        data: jsonData,
        headers: newHeaders.map(h => h.name) 
      });
      return { data: jsonData, headers: newHeaders.map(h => h.name) };
    },
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: ['myExperiments'] });
      setSelectedExperiment(prev => ({ ...prev, ...updatedData }));
      setIsEditDataOpen(false);
    },
    onError: (err) => alert("Failed to save data: " + err.message)
  });

  const numericHeaders = useMemo(() => {
    if (!selectedExperiment?.data || selectedExperiment.data.length === 0) return [];
    const firstRow = selectedExperiment.data[0];
    return selectedExperiment.headers
      .filter(h => typeof firstRow[h] === 'number')
      .map(h => ({ id: h, name: h }));
  }, [selectedExperiment]);

  const handleExperimentChange = (exp) => {
    setSelectedExperiment(exp);
    setHeatmapSelectedVars([]); 
    setModelResults(null);
  };

  const handleRunModel = (vars) => {
    setModelVars(vars);
    runModel({
      data: selectedExperiment.data,
      independent: vars.independentVars,
      dependent: vars.dependentVars
    });
  };

  const handleDataSave = ({ data, columns }) => {
    updateData({ newData: data, newHeaders: columns });
  };

  // --- CALLBACK FOR SUCCESSFUL CREATION ---
  // This is passed to the UploadPage (we need to modify UploadPage to accept it)
  const handleCreateSuccess = (newExperimentId) => {
     setIsCreateOpen(false);
     // Force a refetch of experiments so the new one appears in the list
     queryClient.invalidateQueries(['myExperiments']);
     // Note: In a real app, you might want to fetch the single new experiment here 
     // and set it as 'selectedExperiment', but refetching list + manual select is safer.
     alert("Experiment created! Please select it from the dropdown.");
  };

  if (isLoadingExperiments) return <PageLoader />;

  const initialEditData = selectedExperiment ? selectedExperiment.data.map(row => 
    selectedExperiment.headers.map(header => row[header] !== null && row[header] !== undefined ? String(row[header]) : '')
  ) : [];
  const initialEditColumns = selectedExperiment ? selectedExperiment.headers.map((h, i) => ({ id: `col${i}`, name: h })) : [];

  return (
    <div className="container mx-auto max-w-[95%] space-y-6 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-darkest">Analysis Dashboard</h1>
          <p className="text-secondary-dark mt-1">Select or create an experiment to analyze.</p>
        </div>
        
        <div className="mt-4 md:mt-0 w-full md:w-1/2 flex items-end gap-2">
          <div className="flex-grow">
            <Select
                label="Active Experiment"
                value={selectedExperiment}
                onChange={handleExperimentChange}
                options={experiments || []}
            />
          </div>
          {/* --- NEW CREATE BUTTON --- */}
          <Button className="h-10 whitespace-nowrap" onClick={() => setIsCreateOpen(true)}>
             <FaPlus className="mr-2" /> Create New
          </Button>
          
          {selectedExperiment && (
              <Button variant="secondary" onClick={() => setIsEditDataOpen(true)} className="h-10" title="Edit Data">
                <FaEdit />
              </Button>
          )}
        </div>
      </div>

      {!selectedExperiment ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white  border-2 border-dashed border-secondary-DEFAULT text-secondary-dark">
          <FaChartArea className="h-12 w-12 text-gray-300 mb-3" />
          <p>Please select an experiment above or create a new one.</p>
        </div>
      ) : (
        <Tab.Group>
          {/* ... (Tabs and Panels code remains exactly the same as previous response) ... */}
           <Tab.List className="flex space-x-1  bg-secondary-light p-1">
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full  py-2.5 text-sm font-medium leading-5 text-primary-dark',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-primary focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white shadow'
                    : 'text-gray-600 hover:bg-white/[0.12] hover:text-primary'
                )
              }
            >
              <div className="flex items-center justify-center space-x-2">
                <FaChartArea /> <span>Correlation Heatmap</span>
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full  py-2.5 text-sm font-medium leading-5 text-primary-dark',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-primary focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white shadow'
                    : 'text-gray-600 hover:bg-white/[0.12] hover:text-primary'
                )
              }
            >
              <div className="flex items-center justify-center space-x-2">
                <FaBrain /> <span>Multi-Variable Model (ML)</span>
              </div>
            </Tab>
          </Tab.List>
          
          <Tab.Panels className="mt-4">
            {/* --- HEATMAP TAB (UPDATED) --- */}
            <Tab.Panel className=" bg-white p-6 shadow-sm ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left: Variable Multi-Selector */}
                <div className="lg:col-span-1">
                   <HeatmapVariableList 
                      options={numericHeaders}
                      selected={heatmapSelectedVars}
                      onChange={setHeatmapSelectedVars}
                   />
                </div>

                {/* Right: Heatmap Chart */}
                <div className="lg:col-span-3">
                  <div className="w-full bg-gray-50  border border-gray-100 overflow-hidden">
                     <div className="h-[600px] w-full">
                        <HeatmapChart
                          data={selectedExperiment.data}
                          selectedVariables={heatmapSelectedVars}
                        />
                     </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>

            {/* --- ML MODEL TAB --- */}
            <Tab.Panel className=" bg-white p-6 shadow-sm ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-1">
                    <VariableSelector 
                      experiment={selectedExperiment}
                      onProceed={handleRunModel}
                    />
                 </div>
                 
                 <div className="lg:col-span-2">
                    {isModelRunning ? (
                      <div className="h-64 flex flex-col items-center justify-center text-secondary-dark">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                        <p>Running complex calculations...</p>
                      </div>
                    ) : modelResults ? (
                      <ModelResultDisplay
                        results={modelResults}
                        independentVars={modelVars.independentVars}
                        dependentVars={modelVars.dependentVars}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center  border-2 border-dashed border-secondary-DEFAULT p-12 text-secondary-dark">
                        Configure variables on the left to run the model.
                      </div>
                    )}
                 </div>
               </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      )}

      {/* --- EDIT DATA MODAL --- */}
      <Modal 
        isOpen={isEditDataOpen} 
        onClose={() => setIsEditDataOpen(false)} 
        title="Edit Experiment Data"
        maxWidth="max-w-[90vw]" 
      >
        <div className="h-[80vh] overflow-y-auto p-1">
          <ManualDataEntry 
            onSubmit={handleDataSave}
            initialData={initialEditData}
            initialColumns={initialEditColumns}
          />
        </div>
        {isSavingData && <div className="text-center mt-4 text-primary-dark font-semibold"><Spinner /> Saving Changes...</div>}
      </Modal>

      {/* --- CREATE NEW EXPERIMENT MODAL --- */}
      <Modal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        title="Create New Analysis"
        maxWidth="max-w-4xl" 
      >
        <div className="max-h-[80vh] overflow-y-auto p-1">
            {/* Pass a special prop 'onSuccessOverride' to UploadPage to intercept the navigation */}
            <UploadPage onSuccessOverride={handleCreateSuccess} isModalMode={true} />
        </div>
      </Modal>

    </div>
  );
}