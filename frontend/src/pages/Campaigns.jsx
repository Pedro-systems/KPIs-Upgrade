/**
 * SMS/Text Campaigns Page
 */

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { DataTable, Pagination, FilterBar, EditModal, ConfirmDialog } from '../components';
import { campaignsApi } from '../services/api';
import { 
  formatCurrency, 
  formatPercent, 
  formatDate, 
  formatNumber,
  getValueClass,
  formatBoolean,
  cleanObject 
} from '../utils/formatters';

const columns = [
  { key: 'id', label: 'ID', sortable: true, width: '60px' },
  { key: 'date_created', label: 'Date', sortable: true, render: (v) => formatDate(v) },
  { key: 'county', label: 'County', sortable: true },
  { key: 'state', label: 'State', sortable: true },
  { key: 'entity', label: 'Entity', sortable: true },
  { key: 'channel', label: 'Channel', sortable: true },
  { key: 'campaign_size', label: 'Size', sortable: true, render: (v) => formatNumber(v, 0) },
  { key: 'num_leads_generated', label: 'Leads', sortable: true },
  { key: 'num_contracts_closed', label: 'Contracts', sortable: true },
  { key: 'response_rate', label: 'Resp. Rate', sortable: true, render: (v) => formatPercent(v) },
  { key: 'campaign_cost', label: 'Cost', sortable: true, render: (v) => formatCurrency(v) },
  { key: 'margin_earned', label: 'Margin', sortable: true, render: (v) => (
    <span className={getValueClass(v)}>{formatCurrency(v)}</span>
  )},
  { key: 'is_campaign_complete', label: 'Complete', sortable: false, render: (v) => formatBoolean(v) },
];

const filterConfig = [
  { key: 'county', label: 'County', type: 'text' },
  { key: 'state', label: 'State', type: 'text' },
  { key: 'entity', label: 'Entity', type: 'text' },
  { key: 'channel', label: 'Channel', type: 'text' },
  { key: 'year', label: 'Year', type: 'number' },
  { key: 'month', label: 'Month', type: 'text' },
  { key: 'date_start', label: 'Date From', type: 'date' },
  { key: 'date_end', label: 'Date To', type: 'date' },
];

const formFields = [
  { key: 'date_created', label: 'Date Created', type: 'date' },
  { key: 'month', label: 'Month', type: 'text' },
  { key: 'year', label: 'Year', type: 'number' },
  { key: 'county', label: 'County', type: 'text' },
  { key: 'state', label: 'State', type: 'text' },
  { key: 'entity', label: 'Entity', type: 'text' },
  { key: 'channel', label: 'Channel', type: 'text' },
  { key: 'is_campaign_complete', label: 'Campaign Complete', type: 'checkbox' },
  { key: 'campaign_size', label: 'Campaign Size', type: 'number' },
  { key: 'messages_delivered', label: 'Messages Delivered', type: 'number' },
  { key: 'num_responses', label: 'Responses', type: 'number' },
  { key: 'num_leads_generated', label: 'Leads Generated', type: 'number' },
  { key: 'num_contracts_sent', label: 'Contracts Sent', type: 'number' },
  { key: 'num_contracts_closed', label: 'Contracts Closed', type: 'number' },
  { key: 'num_contracts_cancelled', label: 'Contracts Cancelled', type: 'number' },
  { key: 'response_rate', label: 'Response Rate (%)', type: 'number', step: '0.01' },
  { key: 'response_to_lead_rate', label: 'Response to Lead Rate (%)', type: 'number', step: '0.01' },
  { key: 'lead_to_contract_rate', label: 'Lead to Contract Rate (%)', type: 'number', step: '0.01' },
  { key: 'total_closing_proceeds', label: 'Total Closing Proceeds', type: 'number', step: '0.01' },
  { key: 'average_closing_proceeds_per_contract', label: 'Avg Proceeds/Contract', type: 'number', step: '0.01' },
  { key: 'campaign_cost', label: 'Campaign Cost', type: 'number', step: '0.01' },
  { key: 'average_cost_per_lead', label: 'Avg Cost/Lead', type: 'number', step: '0.01' },
  { key: 'average_cost_per_contract', label: 'Avg Cost/Contract', type: 'number', step: '0.01' },
  { key: 'margin_earned', label: 'Margin Earned', type: 'number', step: '0.01' },
  { key: 'average_margin_per_contract', label: 'Avg Margin/Contract', type: 'number', step: '0.01' },
];

const CampaignsPage = () => {
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
      const response = await campaignsApi.getAll(params);
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
        await campaignsApi.update(selectedItem.id, formData);
        toast.success('Record updated successfully!');
      } else {
        await campaignsApi.create(formData);
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
      await campaignsApi.delete(selectedItem.id);
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
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600">SMS/Text Campaigns</p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          New Campaign
        </button>
      </div>

      <FilterBar filters={filterConfig} values={filters} onChange={handleFilterChange} onClear={handleClearFilters} />
      <DataTable columns={columns} data={data} loading={loading} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} onEdit={handleEdit} onDelete={handleDelete} />
      <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} totalCount={pagination.totalCount} limit={pagination.limit} onPageChange={handlePageChange} />

      <EditModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} onSave={handleSave} title={selectedItem ? 'Edit Campaign' : 'New Campaign'} fields={formFields} data={selectedItem} loading={saving} />
      <ConfirmDialog isOpen={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} onConfirm={handleConfirmDelete} title="Delete Campaign" message={`Are you sure you want to delete campaign #${selectedItem?.id}? This action cannot be undone.`} type="danger" confirmText="Delete" loading={saving} />
    </div>
  );
};

export default CampaignsPage;
