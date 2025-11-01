import React, { useState } from 'react';
import { Modal } from './Modal';
import Button from './Button';
import Spinner from './Spinner';

const Checkbox = ({ id, label, checked, onChange }) => (
  <div className="flex items-center">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 rounded border-secondary-DEFAULT text-primary focus:ring-primary"
    />
    <label htmlFor={id} className="ml-3 block text-sm font-medium text-gray-700">
      {label}
    </label>
  </div>
);

export default function PrintModal({ isOpen, onClose, onGeneratePdf }) {
  const [includeGraph, setIncludeGraph] = useState(true);
  const [includeTable, setIncludeTable] = useState(true);
  const [includeTheory, setIncludeTheory] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await onGeneratePdf({
      includeGraph,
      includeTable,
      includeTheory,
    });
    setIsGenerating(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate PDF Report">
      <div className="space-y-4">
        <p className="text-sm text-secondary-dark">
          Select the components to include in your PDF report.
        </p>
        <div className="space-y-3">
          <Checkbox
            id="includeGraph"
            label="Visualization Graph"
            checked={includeGraph}
            onChange={(e) => setIncludeGraph(e.target.checked)}
          />
          <Checkbox
            id="includeTable"
            label="Full Data Table"
            checked={includeTable}
            onChange={(e) => setIncludeTable(e.target.checked)}
          />
          <Checkbox
            id="includeTheory"
            label="Analysis & Theory"
            checked={includeTheory}
            onChange={(e) => setIncludeTheory(e.target.checked)}
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="secondary" onClick={onClose} disabled={isGenerating}>
          Cancel
        </Button>
        <Button onClick={handleGenerate} disabled={isGenerating} className="min-w-[120px] justify-center">
          {isGenerating ? <Spinner /> : 'Generate PDF'}
        </Button>
      </div>
    </Modal>
  );
}