/**
 * Confirmation Dialog Component
 */

import { ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning', 'danger', 'info', 'success'
  loading = false,
  changes = null, // List of changes to display
}) => {
  if (!isOpen) return null;

  const icons = {
    warning: <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500" />,
    danger: <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />,
    info: <InformationCircleIcon className="h-12 w-12 text-blue-500" />,
    success: <CheckCircleIcon className="h-12 w-12 text-green-500" />,
  };

  const confirmButtonClass = {
    warning: 'btn btn-primary',
    danger: 'btn btn-danger',
    info: 'btn btn-primary',
    success: 'btn btn-success',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            {icons[type]}
            <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-2 text-gray-600">{message}</p>
            
            {changes && changes.length > 0 && (
              <div className="mt-4 w-full text-left">
                <p className="text-sm font-medium text-gray-700 mb-2">Changes:</p>
                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {changes.map((change, index) => (
                    <div key={index} className="text-sm py-1 border-b border-gray-100 last:border-0">
                      <span className="font-medium text-gray-700">{change.field}:</span>
                      <span className="text-red-500 line-through mx-2">{change.oldValue ?? '-'}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-green-600 ml-2">{change.newValue ?? '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={confirmButtonClass[type]}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner inline-block mr-2"></span>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
