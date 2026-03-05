/**
 * Expenses Page
 */

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { DataTable, Pagination, FilterBar, EditModal, ConfirmDialog } from '../components';
import { expensesApi } from '../services/api';
import { 
  formatCurrency, 
  formatDate, 
  getValueClass,
  truncateText,
  cleanObject 
} from '../utils/formatters';

const columns = [
  { key: 'id', label: 'ID', sortable: true, width: '60px' },
  { key: 'date', label: 'Date', sortable: true, render: (v) => formatDate(v) },
  { key: 'description', label: 'Description', sortable: false, render: (v) => truncateText(v, 30) },
  { key: 'vendor_customer', label: 'Vendor/Customer', sortable: true, render: (v) => truncateText(v, 25) },
  { key: 'account_name', label: 'Account', sortable: true },
  { key: 'account_type', label: 'Account Type', sortable: true },
  { key: 'entity', label: 'Entity', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true, render: (v) => (
    <span className={getValueClass(v)}>{formatCurrency(v)}</span>
  )},
  { key: 'balance', label: 'Balance', sortable: true, render: (v) => formatCurrency(v) },
  { key: 'alexa_share', label: 'Alexa', sortable: true, render: (v) => formatCurrency(v) },
  { key: 'imelda_share', label: 'Imelda', sortable: true, render: (v) => formatCurrency(v) },
  { key: 'rhea_share', label: 'Rhea', sortable: true, render: (v) => formatCurrency(v) },
  { key: 'reconciliation_status', label: 'Reconciled', sortable: true },
];

const filterConfig = [
  { key: 'search', label: 'Search', type: 'text', placeholder: 'Description or memo...' },
  { key: 'vendor_customer', label: 'Vendor/Customer', type: 'text' },
  { key: 'account_name', label: 'Account Name', type: 'text' },
  { key: 'account_type', label: 'Account Type', type: 'text' },
  { key: 'entity', label: 'Entity', type: 'text' },
  { key: 'year', label: 'Year', type: 'number' },
  { key: 'month', label: 'Month', type: 'text' },
  { key: 'date_start', label: 'Date From', type: 'date' },
  { key: 'date_end', label: 'Date To', type: 'date' },
  { key: 'min_amount', label: 'Min Amount', type: 'number' },
  { key: 'max_amount', label: 'Max Amount', type: 'number' },
];

const formFields = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'month', label: 'Month', type: 'text' },
  { key: 'year', label: 'Year', type: 'number' },
  { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
  { key: 'vendor_customer', label: 'Vendor/Customer', type: 'text' },
  { key: 'account_name', label: 'Account Name', type: 'text' },
  { key: 'account_type', label: 'Account Type', type: 'text' },
  { key: 'payer_recipient', label: 'Payer/Recipient', type: 'text' },
  { key: 'amount', label: 'Amount', type: 'number', step: '0.01' },
  { key: 'balance', label: 'Balance', type: 'number', step: '0.01' },
  { key: 'reconciliation_status', label: 'Reconciliation Status', type: 'text' },
  { key: 'income_expense_sharing', label: 'Income/Expense Sharing', type: 'text' },
  { key: 'entity', label: 'Entity', type: 'text' },
  { key: 'alexa_share', label: 'Alexa Share', type: 'number', step: '0.01' },
  { key: 'imelda_share', label: 'Imelda Share', type: 'number', step: '0.01' },
  { key: 'rhea_share', label: 'Rhea Share', type: 'number', step: '0.01' },
  { key: 'memo', label: 'Memo', type: 'textarea', fullWidth: true },
];

const ExpensesPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, totalCount: 0, totalPages: 0 });
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [filters, setFilters] = useState({});
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = cleanObject({ page: pagination.page, limit: pagination.limit, sortBy, sortOrder, ...filters });
      const response = await expensesApi.getAll(params);
      setData(response.data.data);
      setPagination((prev) => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      toast.error('Error loading data: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortBy, sortOrder, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSort = (column, order) => { setSortBy(column); setSortOrder(order); };
  const handlePageChange = (newPage) => { setPagination((prev) => ({ ...prev, page: newPage })); };
  const handleFilterChange = (newFilters) => { setFilters(newFilters); setPagination((prev) => ({ ...prev, page: 1 })); };
  const handleClearFilters = () => { setFilters({}); setPagination((prev) => ({ ...prev, page: 1 })); };
  const handleCreate = () => { setSelectedItem(null); setEditModalOpen(true); };
  const handleEdit = (item) => { setSelectedItem(item); setEditModalOpen(true); };
  const handleDelete = (item) => { setSelectedItem(item); setConfirmDialogOpen(true); };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (selectedItem) {
        await expensesApi.update(selectedItem.id, formData);
        toast.success('Record updated successfully!');
      } else {
        await expensesApi.create(formData);
        toast.success('Record created successfully!');
      }
      setEditModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Error saving: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setSaving(true);
    try {
      await expensesApi.delete(selectedItem.id);
      toast.success('Record deleted successfully!');
      setConfirmDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Error deleting: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600">Expenses & Finances</p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          New Expense
        </button>
      </div>

      <FilterBar filters={filterConfig} values={filters} onChange={handleFilterChange} onClear={handleClearFilters} />
      <DataTable columns={columns} data={data} loading={loading} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} onEdit={handleEdit} onDelete={handleDelete} />
      <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} totalCount={pagination.totalCount} limit={pagination.limit} onPageChange={handlePageChange} />

      <EditModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} onSave={handleSave} title={selectedItem ? 'Edit Expense' : 'New Expense'} fields={formFields} data={selectedItem} loading={saving} />
      <ConfirmDialog isOpen={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} onConfirm={handleConfirmDelete} title="Delete Expense" message={`Are you sure you want to delete expense #${selectedItem?.id}? This action cannot be undone.`} type="danger" confirmText="Delete" loading={saving} />
    </div>
  );
};

export default ExpensesPage;
