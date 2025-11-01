import React, { useState } from 'react';
import Button from '../common/Button';
import { FaArrowRight, FaPlus } from 'react-icons/fa';
import CustomFormulaModal from './CustomFormulaModal';
import { v4 as uuidv4 } from 'uuid';

export default function AnalysisSelector({ columnMap, availableCalculations, allowCustomFormulas, onAnalysisComplete }) {
  const [allCalculations, setAllCalculations] = useState(availableCalculations);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter calculations to only show ones where inputs are mapped
  const selectableCalculations = allCalculations.filter(calc => 
    calc.requiredInputs.every(key => columnMap[key])
  );
  
  const handleToggle = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAddCustomFormula = (formulaData) => {
    const newCalc = {
      ...formulaData,
      id: uuidv4(),
    };
    setAllCalculations(prev => [...prev, newCalc]);
    setIsModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass the full calculation objects back, not just IDs
    const selectedCalcs = allCalculations.filter(c => selectedIds.includes(c.id));
    onAnalysisComplete(selectedCalcs);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full space-y-4  bg-white p-6 shadow">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Select Calculations</h3>
          {allowCustomFormulas && (
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(true)}>
              <FaPlus className="mr-2" /> Add Custom
            </Button>
          )}
        </div>
        
        <p className="text-sm text-secondary-dark">
          Choose which analyses to run on your data.
        </p>
        <div className="space-y-3">
          {selectableCalculations.length > 0 ? selectableCalculations.map(calc => (
            <div key={calc.id} className="flex items-start">
              <input
                id={calc.id}
                type="checkbox"
                checked={selectedIds.includes(calc.id)}
                onChange={() => handleToggle(calc.id)}
                className="h-4 w-4 rounded border-secondary-DEFAULT text-primary focus:ring-primary"
              />
              <label htmlFor={calc.id} className="ml-3 block text-sm">
                <span className="font-medium text-gray-900">{calc.name}</span>
                <span className="text-secondary-dark"> ({calc.formula})</span>
              </label>
            </div>
          )) : (
            <p className="text-sm text-secondary-dark">No calculations available for the mapped columns. Try mapping more columns or adding a custom formula.</p>
          )}
        </div>
        <Button type="submit" className="w-full justify-center" disabled={selectedIds.length === 0}>
          Run Analysis <FaArrowRight className="ml-2" />
        </Button>
      </form>
      
      <CustomFormulaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddCustomFormula}
        mappedKeys={Object.keys(columnMap).filter(k => columnMap[k])}
      />
    </>
  );
};