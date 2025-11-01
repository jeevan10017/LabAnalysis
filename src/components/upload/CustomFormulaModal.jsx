import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import Button from '../common/Button';

// This regex finds valid JS variable names
const variableRegex = /[a-zA-Z_][a-zA-Z0-9_]*/g;

export default function CustomFormulaModal({ isOpen, onClose, onSave, mappedKeys }) {
  const [name, setName] = useState('');
  const [formula, setFormula] = useState('');
  const [unit, setUnit] = useState('');
  const [error, setError] = useState(null);

  const handleSave = () => {
    setError(null);
    if (!name || !formula || !unit) {
      setError('Please fill out all fields.');
      return;
    }

    // Find all variable names used in the formula
    const variables = [...new Set(formula.match(variableRegex) || [])];
    
    // Check if all variables are in the mappedKeys
    const unmappedKeys = variables.filter(v => !mappedKeys.includes(v));
    if (unmappedKeys.length > 0) {
      setError(`Formula uses unmapped keys: ${unmappedKeys.join(', ')}. Only mapped keys (${mappedKeys.join(', ')}) are allowed.`);
      return;
    }

    try {
      // Create the dynamic function
      const func = new Function('row', `
        try {
          // Destructure mapped keys from row object
          const { ${variables.join(', ')} } = row;
          const result = ${formula};
          // Ensure result is a number
          return isFinite(result) ? parseFloat(result.toFixed(3)) : null;
        } catch (e) {
          console.error('Custom formula error:', e);
          return null;
        }
      `);

      // Test the function with dummy data
      const testRow = mappedKeys.reduce((acc, key) => ({ ...acc, [key]: 1 }), {});
      if (func(testRow) === null && mappedKeys.length > 0) {
         throw new Error("Formula validation failed. Check syntax.");
      }

      onSave({
        name: name,
        formula: formula,
        outputKey: name.toLowerCase().replace(/\s/g, '_'),
        outputUnit: unit,
        requiredInputs: variables,
        func: func,
      });
      
      // Reset form
      setName('');
      setFormula('');
      setUnit('');
      onClose();

    } catch (e) {
      setError(`Invalid formula syntax: ${e.message}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Custom Formula">
      <div className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <label htmlFor="calc-name" className="block text-sm font-medium text-gray-700">
            Calculation Name (e.g., Density)
          </label>
          <input
            type="text"
            id="calc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full  border-secondary-DEFAULT shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="calc-formula" className="block text-sm font-medium text-gray-700">
            Formula (e.g., mass / volume)
          </label>
          <input
            type="text"
            id="calc-formula"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            className="mt-1 block w-full  border-secondary-DEFAULT shadow-sm font-mono"
            placeholder="Use mapped keys as variables"
          />
          <p className="mt-1 text-xs text-secondary-dark">
            Available keys: {mappedKeys.join(', ') || 'None'}
          </p>
        </div>
        <div>
          <label htmlFor="calc-unit" className="block text-sm font-medium text-gray-700">
            Unit (e.g., kg/m³
)
          </label>
          <input
            type="text"
            id="calc-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="mt-1 block w-full  border-secondary-DEFAULT shadow-sm"
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save Formula</Button>
      </div>
    </Modal>
  );
}