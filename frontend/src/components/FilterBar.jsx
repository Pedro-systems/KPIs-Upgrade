/**
 * Filter Bar Component
 */

import { useState, useEffect, useCallback } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { debounce } from '../utils/formatters';

const FilterBar = ({
  filters,
  values,
  onChange,
  onClear,
}) => {
  const [localValues, setLocalValues] = useState(values);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  // Debounce for text fields
  const debouncedOnChange = useCallback(
    debounce((newValues) => {
      onChange(newValues);
    }, 300),
    [onChange]
  );

  const handleChange = (key, value) => {
    const newValues = { ...localValues, [key]: value };
    setLocalValues(newValues);
    
    // For selects, apply immediately
    const filter = filters.find(f => f.key === key);
    if (filter?.type === 'select' || filter?.type === 'date') {
      onChange(newValues);
    } else {
      debouncedOnChange(newValues);
    }
  };

  const handleClear = () => {
    const clearedValues = {};
    filters.forEach(f => {
      clearedValues[f.key] = '';
    });
    setLocalValues(clearedValues);
    onClear();
  };

  const hasActiveFilters = Object.values(localValues).some(v => v !== '' && v !== null && v !== undefined);

  const renderFilter = (filter) => {
    const value = localValues[filter.key] || '';

    switch (filter.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(filter.key, e.target.value)}
            placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
            className="form-input text-sm"
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(filter.key, e.target.value)}
            className="form-select text-sm"
          >
            <option value="">All</option>
            {filter.options?.map((option) => (
              <option key={option.value ?? option} value={option.value ?? option}>
                {option.label ?? option}
              </option>
            ))}
          </select>
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(filter.key, e.target.value)}
            className="form-input text-sm"
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(filter.key, e.target.value)}
            placeholder={filter.placeholder || filter.label}
            className="form-input text-sm"
            step="any"
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="filter-bar">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-gray-700 font-medium"
        >
          <FunnelIcon className="h-5 w-5" />
          Filters
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </button>
        
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
            Clear filters
          </button>
        )}
      </div>
      
      {isExpanded && (
        <div className="filter-grid">
          {filters.map((filter) => (
            <div key={filter.key}>
              <label className="form-label">{filter.label}</label>
              {renderFilter(filter)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
