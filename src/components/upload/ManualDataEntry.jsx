import React, { useState } from 'react';
import { FaPlus, FaTrash, FaArrowRight } from 'react-icons/fa';
import Button from '../common/Button';

export default function ManualDataEntry({ onSubmit }) {
  const [columns, setColumns] = useState([
    { id: 'col1', name: 'Pressure' },
    { id: 'col2', name: 'Volume' },
  ]);
  const [data, setData] = useState([
    ['101', '2.0'],
    ['105', '1.9'],
  ]);

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
    <form onSubmit={handleSubmit} className="w-full space-y-4  bg-white p-6 shadow">
      <h3 className="text-lg font-semibold text-gray-800">Enter Data Manually</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={col.id} className="p-2">
                  <input
                    type="text"
                    value={col.name}
                    onChange={(e) => handleColumnNameChange(index, e.target.value)}
                    className="w-full  border-secondary-DEFAULT p-2 text-sm font-medium"
                    placeholder="Column Name"
                  />
                  <Button type="button" variant="ghost" className="p-1 -ml-1 text-red-500" onClick={() => handleRemoveColumn(index)}>
                    <FaTrash size={12} />
                  </Button>
                </th>
              ))}
              <th className="p-2">
                <Button type="button" variant="secondary" onClick={handleAddColumn}>
                  <FaPlus />
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="p-1">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      className="w-full  border-secondary-DEFAULT p-2 text-sm"
                      placeholder="Value"
                    />
                  </td>
                ))}
                <td className="p-1">
                  <Button type="button" variant="ghost" className="p-1 text-red-500" onClick={() => handleRemoveRow(rowIndex)}>
                    <FaTrash size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="secondary" onClick={handleAddRow}>
          <FaPlus className="mr-2" /> Add Row
        </Button>
        <Button type="submit" className="w-full max-w-xs">
          Process Data <FaArrowRight className="ml-2" />
        </Button>
      </div>
    </form>
  );
}