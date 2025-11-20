import React, { useState, useMemo, Fragment, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthStore } from '../hooks/useAuthStore';
import { useLocation } from 'react-router-dom'; // Import useLocation
import PageLoader from '../components/common/PageLoader';
import { FaChevronDown, FaChartArea, FaBrain, FaEdit } from 'react-icons/fa';
import { Listbox, Tab } from '@headlessui/react';
import Button from '../components/common/Button';
import HeatmapChart from '../components/visualization/HeatmapChart';
import VariableSelector from '../components/upload/VariableSelector';
import ModelResultDisplay from '../components/visualization/ModelResultDisplay';
import { Modal } from '../components/common/Modal';
import ManualDataEntry from '../components/upload/ManualDataEntry';
import Spinner from '../components/common/Spinner';
import { useLayoutStore } from '../hooks/useLayoutStore';

// Helper for class names
function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

// Reusable Select
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

// --- SIMULATED BACKEND ---
const runMultiVariableModel = async (experimentData, independentVars, dependentVars) => {
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
  const location = useLocation(); // Get navigation state
  const queryClient = useQueryClient();

  const { setIsCollapsed } = useLayoutStore();
  useEffect(() => {
    setIsCollapsed(true); // Close sidebar when entering this page
  }, [setIsCollapsed]);
  
  // State
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [isEditDataOpen, setIsEditDataOpen] = useState(false); // Edit Modal State
  
  // Heatmap State
  const [heatmapVars, setHeatmapVars] = useState({ x: '', y: '', z: '' });
  
  // Model State
  const [modelResults, setModelResults] = useState(null);
  const [modelVars, setModelVars] = useState({ independentVars: [], dependentVars: [] });

  // 1. Fetch user's experiments
  const { data: experiments, isLoading: isLoadingExperiments } = useQuery({
    queryKey: ['myExperiments', user?.uid],
    queryFn: async () => {
      const q = query(collection(db, 'experiments'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), name: doc.data().title }));
    },
    enabled: !!user,
  });

  // --- AUTO-SELECT LOGIC ---
  useEffect(() => {
    if (experiments && location.state?.experimentId && !selectedExperiment) {
        const targetExp = experiments.find(e => e.id === location.state.experimentId);
        if (targetExp) {
            setSelectedExperiment(targetExp);
        }
    }
  }, [experiments, location.state, selectedExperiment]);

  // 2. Run Model Mutation
  const { mutate: runModel, isLoading: isModelRunning } = useMutation({
    mutationFn: (variables) => 
      runMultiVariableModel(variables.data, variables.independent, variables.dependent),
    onSuccess: (results) => {
      setModelResults(results);
    },
    onError: (err) => alert(`Error: ${err.message}`)
  });

  // --- DATA EDITING MUTATION ---
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
      // Return the updated data structure to update local state
      return { data: jsonData, headers: newHeaders.map(h => h.name) };
    },
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: ['myExperiments'] });
      // Update local selectedExperiment to reflect changes immediately
      setSelectedExperiment(prev => ({ ...prev, ...updatedData }));
      setIsEditDataOpen(false);
    },
    onError: (err) => alert("Failed to save data: " + err.message)
  });

  // Numeric headers for dropdowns
  const numericHeaders = useMemo(() => {
    if (!selectedExperiment?.data || selectedExperiment.data.length === 0) return [];
    const firstRow = selectedExperiment.data[0];
    return selectedExperiment.headers
      .filter(h => typeof firstRow[h] === 'number')
      .map(h => ({ id: h, name: h }));
  }, [selectedExperiment]);

  // Handlers
  const handleExperimentChange = (exp) => {
    setSelectedExperiment(exp);
    setHeatmapVars({ x: '', y: '', z: '' }); 
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

  if (isLoadingExperiments) return <PageLoader />;

  // Prepare initial data for edit modal
  const initialEditData = selectedExperiment ? selectedExperiment.data.map(row => 
    selectedExperiment.headers.map(header => row[header] !== null && row[header] !== undefined ? String(row[header]) : '')
  ) : [];
  const initialEditColumns = selectedExperiment ? selectedExperiment.headers.map((h, i) => ({ id: `col${i}`, name: h })) : [];

  return (
    <div className="container mx-auto max-w-[95%] space-y-6 px-4 pb-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-darkest">Analysis Dashboard</h1>
          <p className="text-secondary-dark mt-1">Select an experiment to unlock analysis tools.</p>
        </div>
        
        <div className="mt-4 md:mt-0 w-full md:w-1/3 flex space-x-2">
          <div className="flex-grow">
            <Select
                label="Active Experiment"
                value={selectedExperiment}
                onChange={handleExperimentChange}
                options={experiments || []}
            />
          </div>
          {/* Edit Button on Dashboard */}
          {selectedExperiment && (
              <div className="flex items-end">
                  <Button variant="secondary" onClick={() => setIsEditDataOpen(true)} className="h-10" title="Edit Data">
                    <FaEdit />
                  </Button>
              </div>
          )}
        </div>
      </div>

      {!selectedExperiment ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white  border-2 border-dashed border-secondary-DEFAULT text-secondary-dark">
          <FaChartArea className="h-12 w-12 text-gray-300 mb-3" />
          <p>Please select an experiment from the dropdown above to begin.</p>
        </div>
      ) : (
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-secondary-light p-1">
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
                <FaChartArea /> <span>Heatmap Visualizer</span>
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
            {/* --- HEATMAP TAB --- */}
            <Tab.Panel className="rounded-xl bg-white p-6 shadow-sm ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2">
              <h2 className="text-xl font-semibold mb-4">Live Heatmap Configuration</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Select
                  label="X-Axis (Independent)"
                  value={heatmapVars.x ? { name: heatmapVars.x } : null}
                  onChange={(v) => setHeatmapVars(p => ({ ...p, x: v.name }))}
                  options={numericHeaders}
                />
                <Select
                  label="Y-Axis (Dependent)"
                  value={heatmapVars.y ? { name: heatmapVars.y } : null}
                  onChange={(v) => setHeatmapVars(p => ({ ...p, y: v.name }))}
                  options={numericHeaders}
                />
                <Select
                  label="Z-Axis (Color Value)"
                  value={heatmapVars.z ? { name: heatmapVars.z } : null}
                  onChange={(v) => setHeatmapVars(p => ({ ...p, z: v.name }))}
                  options={numericHeaders}
                />
              </div>

              <div className="w-full bg-gray-50  border border-gray-100 overflow-hidden">
                {heatmapVars.x && heatmapVars.y && heatmapVars.z ? (
                  <div className="h-[500px] w-full">
                    <HeatmapChart
                      data={selectedExperiment.data}
                      xVar={heatmapVars.x}
                      yVar={heatmapVars.y}
                      zVar={heatmapVars.z}
                    />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-secondary-dark">
                    Select X, Y, and Z variables to generate the heatmap.
                  </div>
                )}
              </div>
            </Tab.Panel>

            {/* --- ML MODEL TAB --- */}
            <Tab.Panel className="rounded-xl bg-white p-6 shadow-sm ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2">
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

    </div>
  );
}