import React, { useState, useMemo } from 'react';
import Button from '../common/Button';

// Reusable Checkbox List component
const CheckboxList = ({ title, options, selected, onChange }) => {
  const handleToggle = (optionName) => {
    if (selected.includes(optionName)) {
      onChange(selected.filter(item => item !== optionName));
    } else {
      onChange([...selected, optionName]);
    }
  };

  return (
    <div>
      {/* Reduced font size: text-lg -> text-sm */}
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      
      {/* Added 'scrollbar-thin' class */}
      <div className="mt-2 space-y-2 max-h-48 overflow-y-auto  border border-secondary-DEFAULT p-3 scrollbar-thin">
        {options.map((option) => (
          <div key={option} className="flex items-center">
            <input
              id={`cb-${option}`}
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => handleToggle(option)}
              className="h-4 w-4 rounded border-secondary-DEFAULT text-primary focus:ring-primary"
            />
            {/* Reduced option font size slightly: text-sm -> text-xs */}
            <label htmlFor={`cb-${option}`} className="ml-3 block text-xs font-medium text-gray-700">
              {option}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function VariableSelector({ experiment, onProceed }) {
  const [independentVars, setIndependentVars] = useState([]);
  const [dependentVars, setDependentVars] = useState([]);

  // Get all numeric headers from the experiment data
  const numericHeaders = useMemo(() => {
    if (!experiment?.data || experiment.data.length === 0) return [];
    const firstRow = experiment.data[0];
    return experiment.headers.filter(h => typeof firstRow[h] === 'number');
  }, [experiment]);

  // Ensure a variable can't be both independent and dependent
  const availableIndependent = numericHeaders.filter(h => !dependentVars.includes(h));
  const availableDependent = numericHeaders.filter(h => !independentVars.includes(h));
  
  const canProceed = independentVars.length > 0 && dependentVars.length > 0;

  return (
    <div className=" bg-white p-2 shadow-sm space-y-6">
      {/* Reduced font size: text-xl -> text-lg */}
      <h2 className="text-lg font-semibold text-gray-900">Configure Multi-Variable Model</h2>
      
      {/* Reduced font size: text-sm -> text-xs */}
      <p className="text-xs text-secondary-dark">
        Select one or more input variables (Independent) to predict one or more output variables (Dependent).
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CheckboxList
          title="Please select your Independent Variable(s)"
          options={availableIndependent}
          selected={independentVars}
          onChange={setIndependentVars}
        />
        <CheckboxList
          title="Please select your Dependent Variable(s)"
          options={availableDependent}
          selected={dependentVars}
          onChange={setDependentVars}
        />
      </div>

      <div className="pt-4 text-center">
        {/* Applied text-xs via className to override Button default */}
        <Button 
          onClick={() => onProceed({ independentVars, dependentVars })} 
          disabled={!canProceed}
          className="text-xs"
        >
          Do you want to proceed with the above selection?
        </Button>
      </div>
    </div>
  );
}