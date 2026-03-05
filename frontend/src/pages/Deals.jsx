/**
 * Deals Page (Properties/Real Estate)
 */

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { DataTable, Pagination, FilterBar, EditModal, ConfirmDialog } from '../components';
import { dealsApi } from '../services/api';
import { 
  formatCurrency, 
  formatPercent, 
  formatDate, 
  formatNumber,
  getValueClass,
  truncateText,
  cleanObject 
} from '../utils/formatters';

// Table column definitions
const columns = [
  { key: 'id', label: 'ID', sortable: true, width: '60px' },
  { 
    key: 'property_description', 
    label: 'Description', 
    sortable: true,
    render: (value) => truncateText(value, 40),
  },
  { key: 'property_apn', label: 'APN', sortable: true },
  { 
    key: 'acres', 
    label: 'Acres', 
    sortable: true,
    render: (value) => formatNumber(value, 2),
  },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'entity', label: 'Entity', sortable: true },
  { 
    key: 'purchase_date', 
    label: 'Purchase Date', 
    sortable: true,
    render: (value) => formatDate(value),
  },
  { 
    key: 'purchase_price', 
    label: 'Purchase Price', 
    sortable: true,
    render: (value) => formatCurrency(value),
  },
  { 
    key: 'sale_date', 
    label: 'Sale Date', 
    sortable: true,
    render: (value) => formatDate(value),
  },
  { 
    key: 'sale_price', 
    label: 'Sale Price', 
    sortable: true,
    render: (value) => formatCurrency(value),
  },
  { 
    key: 'profit', 
    label: 'Profit', 
    sortable: true,
    render: (value) => (
      <span className={getValueClass(value)}>{formatCurrency(value)}</span>
    ),
  },
  { 
    key: 'roi', 
    label: 'ROI', 
    sortable: true,
    render: (value) => (
      <span className={getValueClass(value)}>{formatPercent(value)}</span>
    ),
  },
  { 
    key: 'days_in_inventory', 
    label: 'Days Inv.', 
    sortable: true,
  },
];

// Filter definitions
const filterConfig = [
  { key: 'search', label: 'Search', type: 'text', placeholder: 'Description or APN...' },
  { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Sold', 'Pending', 'Cancelled'] },
  { key: 'entity', label: 'Entity', type: 'text' },
  { key: 'purchase_date_start', label: 'Purchase From', type: 'date' },
  { key: 'purchase_date_end', label: 'Purchase To', type: 'date' },
  { key: 'min_profit', label: 'Min Profit', type: 'number' },
];

// Form field definitions
const formFields = [
  { key: 'property_description', label: 'Property Description', type: 'textarea', fullWidth: true },
  { key: 'property_apn', label: 'APN', type: 'text' },
  { key: 'acres', label: 'Acres', type: 'number', step: '0.01' },
  { key: 'campaign_type', label: 'Campaign Type', type: 'text' },
  { key: 'entity', label: 'Entity', type: 'text' },
  { key: 'partners', label: 'Partners', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Sold', 'Pending', 'Cancelled'], required: true },
  { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
  { key: 'purchase_price', label: 'Purchase Price', type: 'number', step: '0.01' },
  { key: 'funding_costs', label: 'Funding Costs', type: 'number', step: '0.01' },
  { key: 'sale_date', label: 'Sale Date', type: 'date' },
  { key: 'sale_year', label: 'Sale Year', type: 'number' },
  { key: 'sale_price', label: 'Sale Price', type: 'number', step: '0.01' },
  { key: 'estimated_payback_date', label: 'Estimated Payback Date', type: 'text' },
  { key: 'closing_costs', label: 'Closing Costs', type: 'number', step: '0.01' },
  { key: 'funding_payout', label: 'Funding Payout', type: 'number', step: '0.01' },
  { key: 'total_costs', label: 'Total Costs', type: 'number', step: '0.01' },
  { key: 'revenue', label: 'Revenue', type: 'number', step: '0.01' },
  { key: 'profit', label: 'Profit', type: 'number', step: '0.01' },
  { key: 'gross_profit', label: 'Gross Profit', type: 'number', step: '0.01' },
  { key: 'days_in_inventory', label: 'Days in Inventory', type: 'number' },
  { key: 'roi', label: 'ROI (%)', type: 'number', step: '0.01' },
  { key: 'gross_margin', label: 'Gross Margin (%)', type: 'number', step: '0.01' },
];

const DealsPage = () => {
  // State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
  });
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [filters, setFilters] = useState({});
  
  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = cleanObject({
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
        ...filters,
      });
      
      const response = await dealsApi.getAll(params);
      setData(response.data.data);
      setPagination((prev) => ({
        ...prev,
        ...response.data.pagination,
      }));
    } catch (error) {
      toast.error('Error loading data: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortBy, sortOrder, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleSort = (column, order) => {
    setSortBy(column);
    setSortOrder(order);
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setEditModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setConfirmDialogOpen(true);
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (selectedItem) {
        await dealsApi.update(selectedItem.id, formData);
        toast.success('Record updated successfully!');
      } else {
        await dealsApi.create(formData);
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
      await dealsApi.delete(selectedItem.id);
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
          <p className="text-gray-600">Properties & Real Estate</p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          New Deal
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalCount={pagination.totalCount}
        limit={pagination.limit}
        onPageChange={handlePageChange}
      />

      {/* Edit Modal */}
      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSave}
        title={selectedItem ? 'Edit Deal' : 'New Deal'}
        fields={formFields}
        data={selectedItem}
        loading={saving}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Deal"
        message={`Are you sure you want to delete the deal "${selectedItem?.property_description || selectedItem?.id}"? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        loading={saving}
      />
    </div>
  );
};

export default DealsPage;
