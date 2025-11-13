import React, { useState, useMemo, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthStore } from '../hooks/useAuthStore';
import PageLoader from '../components/common/PageLoader';
import { FaChevronDown } from 'react-icons/fa';
import { Listbox, RadioGroup } from '@headlessui/react';
import Button from '../components/common/Button';
import HeatmapChart from '../components/visualization/HeatmapChart';

// Reusable Select component
const Select = ({ label, value, onChange, options, valueKey = "id" }) => (
  <Listbox value={value} onChange={onChange}>
    <div className="relative">
      <Listbox.Label className="block text-sm font-medium text-gray-700">{label}</Listbox.Label>
      <Listbox.Button className="relative mt-1 w-full cursor-default rounded-md border border-secondary-DEFAULT bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm">
        <span className="block truncate">{value ? value.name : 'Select an option'}</span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <FaChevronDown className="h-5 w-5 text-gray-400" />
        </span>
      </Listbox.Button>
      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
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

export default function SelectModulePage() {
  const { user } = useAuthStore();
  const [step, setStep] = useState(0); // 0: Select Experiment, 1: Select Model, 2: Configure Vars, 3: View
  
  // State for selections
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [heatmapVars, setHeatmapVars] = useState({ x: '', y: '', z: '' });

  // 1. Fetch user's experiments
  const { data: experiments, isLoading } = useQuery({
    queryKey: ['myExperiments', user?.uid],
    queryFn: async () => {
      const q = query(collection(db, 'experiments'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), name: doc.data().title }));
    },
    enabled: !!user,
  });

  // Memoize headers of selected experiment
  const numericHeaders = useMemo(() => {
    if (!selectedExperiment?.data || selectedExperiment.data.length === 0) return [];
    const firstRow = selectedExperiment.data[0];
    // Get headers for columns that contain numeric data
    return selectedExperiment.headers
      .filter(h => typeof firstRow[h] === 'number')
      .map(h => ({ id: h, name: h })); // Format for Select component
  }, [selectedExperiment]);

  const analysisModels = [
    { id: 'heatmap', name: 'Heatmap Generator' },
    { id: 'multimodel', name: 'Multi-Variable Model (Coming Soon)', disabled: true },
  ];

  // --- Workflow Handlers ---
  const handleProceed = () => {
    setStep(prev => prev + 1);
  };
  
  const resetFlow = () => {
    setStep(0);
    setSelectedExperiment(null);
    setSelectedModel(null);
    setHeatmapVars({ x: '', y: '', z: '' });
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="container mx-auto max-w-4xl space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-secondary-darkest">Analysis Modules</h1>
        {step > 0 && (
          <Button variant="secondary" onClick={resetFlow}>Start Over</Button>
        )}
      </div>

      {/* --- Step 0: Select Experiment --- */}
      {step === 0 && (
        <div className="rounded-lg bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">1. Select an Experiment to Analyze</h2>
          <Select
            label="Choose one of your saved experiments"
            value={selectedExperiment}
            onChange={setSelectedExperiment}
            options={experiments || []}
          />
          <Button onClick={handleProceed} disabled={!selectedExperiment}>
            Next
          </Button>
        </div>
      )}

      {/* --- Step 1: Select Model (as per sketch) --- */}
      {step === 1 && (
        <div className="rounded-lg bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">2. Which model do you want to select?</h2>
          <RadioGroup value={selectedModel} onChange={setSelectedModel}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisModels.map((model) => (
                <RadioGroup.Option
                  key={model.id}
                  value={model}
                  disabled={model.disabled}
                  className={({ checked }) =>
                    `cursor-pointer rounded-lg border p-4 ${
                      checked ? 'border-primary bg-primary-light' : 'border-secondary-DEFAULT'
                    } ${model.disabled ? 'opacity-50 cursor-not-allowed' : ''}`
                  }
                >
                  <span className="font-medium">{model.name}</span>
                </RadioGroup.Option>
              ))}
            </div>
          </RadioGroup>
          <Button onClick={handleProceed} disabled={!selectedModel}>
            Next
          </Button>
        </div>
      )}

      {/* --- Step 2: Configure Heatmap (as per sketch) --- */}
      {step === 2 && selectedModel?.id === 'heatmap' && (
        <div className="rounded-lg bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">3. Select Heatmap Variables</h2>
          <p className="text-sm text-secondary-dark">Select the variables for the X, Y, and Z (Value) axes. All variables must be numeric.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Independent Variable (X-Axis)"
              value={heatmapVars.x ? { id: heatmapVars.x, name: heatmapVars.x } : null}
              onChange={(v) => setHeatmapVars(p => ({ ...p, x: v.name }))}
              options={numericHeaders}
              valueKey="name"
            />
            <Select
              label="Dependent Variable (Y-Axis)"
              value={heatmapVars.y ? { id: heatmapVars.y, name: heatmapVars.y } : null}
              onChange={(v) => setHeatmapVars(p => ({ ...p, y: v.name }))}
              options={numericHeaders.filter(h => h.name !== heatmapVars.x)}
              valueKey="name"
            />
            <Select
              label="Value (Z-Axis / Color)"
              value={heatmapVars.z ? { id: heatmapVars.z, name: heatmapVars.z } : null}
              onChange={(v) => setHeatmapVars(p => ({ ...p, z: v.name }))}
              options={numericHeaders.filter(h => h.name !== heatmapVars.x && h.name !== heatmapVars.y)}
              valueKey="name"
            />
          </div>
          <p className="text-sm text-secondary-dark">
            You have selected: 
            X = <span className="font-medium text-gray-900">{heatmapVars.x || '...'}</span>, 
            Y = <span className="font-medium text-gray-900">{heatmapVars.y || '...'}</span>, 
            Z = <span className="font-medium text-gray-900">{heatmapVars.z || '...'}</span>
          </p>
          <Button onClick={handleProceed} disabled={!heatmapVars.x || !heatmapVars.y || !heatmapVars.z}>
            Do you want to proceed?
          </Button>
        </div>
      )}
      
      {/* --- Step 3: Show Result (as per sketch) --- */}
      {step === 3 && selectedModel?.id === 'heatmap' && (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Heatmap Result</h2>
          <h3 className="text-lg text-secondary-dark mb-4">{selectedExperiment.title}</h3>
          <div className="w-full aspect-video">
            <HeatmapChart
              data={selectedExperiment.data}
              xVar={heatmapVars.x}
              yVar={heatmapVars.y}
              zVar={heatmapVars.z}
            />
          </div>
        </div>
      )}
    </div>
  );
}