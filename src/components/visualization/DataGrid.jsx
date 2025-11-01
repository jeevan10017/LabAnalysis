import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';

export function DataGrid({ data, columns: columnDefs }) {
  const columns = useMemo(() => columnDefs, [columnDefs]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table className="min-w-full divide-y divide-secondary-DEFAULT">
      <thead className="bg-secondary-light">
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th
                key={header.id}
                scope="col"
                className="px-6 py-3 text-left text-sm font-medium tracking-wide text-gray-600"
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody className="divide-y divide-secondary-light bg-white">
        {table.getRowModel().rows.map(row => (
          <tr key={row.id} className="hover:bg-secondary-light/50">
            {row.getVisibleCells().map(cell => (
              <td key={cell.id} className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}