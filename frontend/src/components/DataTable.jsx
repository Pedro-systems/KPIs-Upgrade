/**
 * Data Table Component
 * Displays data in a table format with sorting
 */

import { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const DataTable = ({
  columns,
  data,
  onSort,
  sortBy,
  sortOrder,
  onEdit,
  onDelete,
  loading = false,
  emptyMessage = 'No records found',
}) => {
  const handleSort = (column) => {
    if (!column.sortable) return;
    
    const newOrder = sortBy === column.key && sortOrder === 'ASC' ? 'DESC' : 'ASC';
    onSort?.(column.key, newOrder);
  };

  const renderSortIcon = (column) => {
    if (!column.sortable) return null;
    if (sortBy !== column.key) {
      return <span className="ml-1 text-gray-300">⇅</span>;
    }
    return sortOrder === 'ASC' 
      ? <ChevronUpIcon className="ml-1 h-4 w-4 inline" />
      : <ChevronDownIcon className="ml-1 h-4 w-4 inline" />;
  };

  const renderCell = (row, column) => {
    const value = row[column.key];
    
    if (column.render) {
      return column.render(value, row);
    }
    
    return value ?? '-';
  };

  if (loading) {
    return (
      <div className="table-container">
        <div className="flex items-center justify-center py-12">
          <div className="spinner"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => handleSort(column)}
                className={column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                style={{ width: column.width }}
              >
                {column.label}
                {renderSortIcon(column)}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th style={{ width: '100px' }}>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                className="text-center py-8 text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={row.id || index}>
                {columns.map((column) => (
                  <td key={column.key} className={column.className}>
                    {renderCell(row, column)}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td>
                    <div className="flex items-center gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
