/**
 * Edit/Create Modal Component
 */

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatDateForInput } from '../utils/formatters';

const EditModal = ({
  isOpen,
  onClose,
  onSave,
  title,
  fields,
  data,
  loading = false,
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Initialize with existing data or default values
      const initialData = {};
      fields.forEach((field) => {
        let value = data?.[field.key] ?? field.defaultValue ?? '';
        if (field.type === 'date' && value) {
          value = formatDateForInput(value);
        }
        initialData[field.key] = value;
      });
      setFormData(initialData);
      setErrors({});
    }
  }, [isOpen, data, fields]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear error on edit
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    fields.forEach((field) => {
      if (field.required && !formData[field.key]) {
        newErrors[field.key] = `${field.label} is required`;
      }
      if (field.type === 'number' && formData[field.key]) {
        const num = parseFloat(formData[field.key]);
        if (isNaN(num)) {
          newErrors[field.key] = `${field.label} must be a valid number`;
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Convert numeric values
      const processedData = { ...formData };
      fields.forEach((field) => {
        if (field.type === 'number' && processedData[field.key]) {
          processedData[field.key] = parseFloat(processedData[field.key]);
        }
        if (field.type === 'checkbox') {
          processedData[field.key] = Boolean(processedData[field.key]);
        }
      });
      onSave(processedData);
    }
  };

  const renderField = (field) => {
    const value = formData[field.key] ?? '';
    const error = errors[field.key];

    const baseClass = error 
      ? 'form-input border-red-500 focus:ring-red-500' 
      : 'form-input';

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={baseClass}
            disabled={loading}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={baseClass}
            step={field.step || 'any'}
            disabled={loading}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            className={baseClass}
            disabled={loading}
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            className={error ? 'form-select border-red-500' : 'form-select'}
            disabled={loading}
          >
            <option value="">Select...</option>
            {field.options?.map((option) => (
              <option key={option.value ?? option} value={option.value ?? option}>
                {option.label ?? option}
              </option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={baseClass}
            rows={field.rows || 3}
            disabled={loading}
          />
        );
      
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleChange(field.key, e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              disabled={loading}
            />
            <span className="text-sm text-gray-700">{field.checkboxLabel || 'Yes'}</span>
          </label>
        );
      
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((field) => (
                <div key={field.key} className={field.fullWidth ? 'md:col-span-2' : ''}>
                  <label className="form-label">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                  {errors[field.key] && (
                    <p className="form-error">{errors[field.key]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner inline-block mr-2"></span>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
