import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaArrowRight } from 'react-icons/fa';
import Button from '../common/Button';

const defaultColumns = [
  { id: 'col1', name: 'Pressure' },
  { id: 'col2', name: 'Volume' },
];
const defaultData = [
  ['101', '2.0'],
  ['105', '1.9'],
];

export default function ManualDataEntry({ 
  onSubmit, 
  initialColumns, 
  initialData 
}) {
  const [columns, setColumns] = useState(initialColumns || defaultColumns);
  const [data, setData] = useState(initialData || defaultData);

  useEffect(() => {
    if (initialColumns) setColumns(initialColumns);
    if (initialData) setData(initialData);
  }, [initialColumns, initialData]);

  const handleAddColumn = () => {
    const newColId = `col${columns.length + 1}`;
    setColumns([...columns, { id: newColId, name: 'New Column' }]);
    setData(data.map(row => [...row, '']));
  };

  const handleAddRow = () => {
    setData([...data, Array(columns.length).fill('')]);
  };

  const handleColumnNameChange = (index, newName) => {
    const newColumns = [...columns];
    newColumns[index].name = newName;
    setColumns(newColumns);
  };
  
  const handleCellChange = (rowIndex, colIndex, value) => {
    const newData = [...data];
    newData[rowIndex][colIndex] = value;
    setData(newData);
  };
  
  const handleRemoveColumn = (index) => {
    setColumns(columns.filter((_, i) => i !== index));
    setData(data.map(row => row.filter((_, i) => i !== index)));
  };
  
  const handleRemoveRow = (index) => {
    setData(data.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ data, columns });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4  bg-white p-2 ">
      <h3 className="text-lg font-semibold text-gray-800">
        {initialData ? '' : 'Enter Data Manually'}
      </h3>
      {initialData && (
        <p className="text-sm text-secondary-dark -mt-2">
          You can edit values, add rows, or change column names below.
        </p>
      )}
      <div className="overflow-x-auto border border-secondary-DEFAULT ">
        <table className="min-w-full divide-y divide-secondary-DEFAULT">
          <thead className="bg-secondary-light">
            <tr>
              {columns.map((col, index) => (
                <th key={col.id} className="p-2 min-w-[150px] relative group border-r border-secondary-DEFAULT last:border-r-0">
                  <input
                    type="text"
                    value={col.name}
                    onChange={(e) => handleColumnNameChange(index, e.target.value)}
                    className="w-full  border-transparent bg-transparent p-1 text-sm font-bold text-gray-700 focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
                    placeholder="Column Name"
                  />
                  <button
                    type="button"
                    className="absolute top-1 right-1 p-1 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                    onClick={() => handleRemoveColumn(index)}
                    title="Remove Column"
                  >
                    <FaTrash size={10} />
                  </button>
                </th>
              ))}
              <th className="p-2 w-12 bg-secondary-light">
                <Button type="button" variant="ghost" className="w-full justify-center" onClick={handleAddColumn} title="Add Column">
                  <FaPlus size={12} />
                </Button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-DEFAULT bg-white">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="p-1 min-w-[150px] border-r border-secondary-DEFAULT last:border-r-0">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      className="w-full  border-transparent p-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="-"
                    />
                  </td>
                ))}
                <td className="p-1 w-12 text-center">
                  <button 
                    type="button" 
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    onClick={() => handleRemoveRow(rowIndex)}
                    title="Remove Row"
                  >
                    <FaTrash size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center pt-4">
        <Button type="button" variant="secondary" onClick={handleAddRow}>
          <FaPlus className="mr-2" /> Add Row
        </Button>
        <Button type="submit" className="w-full max-w-xs">
          Save Data <FaArrowRight className="ml-2" />
        </Button>
      </div>
    </form>
  );
}