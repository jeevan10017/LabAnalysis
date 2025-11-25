import React, { useState, useMemo } from 'react';
import Button from '../common/Button';
import { FaArrowRight } from 'react-icons/fa';


const LABEL_MAPPING = {
  pressure: "Select variable on X axis",
  volume: "Select variable on Y axis"
};

export default function ColumnMapper({ detectedHeaders, availableCalculations, onMapComplete }) {
  // Get all unique required inputs from ALL calculations
  const allRequiredInputs = useMemo(() => [
    ...new Set(availableCalculations.flatMap(calc => calc.requiredInputs))
  ], [availableCalculations]);
  
  const [mapping, setMapping] = useState(
    allRequiredInputs.reduce((acc, key) => ({ ...acc, [key]: '' }), {})
  );

  const handleSelectChange = (stdKey, userKey) => {
    setMapping(prev => ({ ...prev, [stdKey]: userKey }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onMapComplete(mapping);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4 bg-white p-6 shadow rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800">Map Your Columns</h3>
      <p className="text-sm text-secondary-dark">
        Match your file columns to the required inputs for analysis.
      </p>
      {allRequiredInputs.map(stdKey => (
        <div key={stdKey}>
          <label htmlFor={stdKey} className="block text-sm font-medium text-gray-700">
            {/* Use the custom mapping, or fall back to the key name if not found */}
            {LABEL_MAPPING[stdKey] || `Select ${stdKey} column`}
          </label>
          <select
            id={stdKey}
            value={mapping[stdKey]}
            onChange={(e) => handleSelectChange(stdKey, e.target.value)}
            className="mt-1 block w-full rounded-md border-secondary-DEFAULT shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            <option value="">Select a column...</option>
            {detectedHeaders.map(header => (
              <option key={header} value={header}>{header}</option>
            ))}
          </select>
        </div>
      ))}
      <Button type="submit" className="w-full justify-center">
        Confirm Mapping <FaArrowRight className="ml-2" />
      </Button>
    </form>
  );
};