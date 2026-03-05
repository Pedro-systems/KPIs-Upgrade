/**
 * Mail Campaigns Analytics/KPIs Page
 */

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { mailCampaignsApi } from '../services/api';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';

// KPI Card Component
const KpiCard = ({ title, value, subtitle, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-xs mt-1 opacity-60">{subtitle}</p>}
      {trend !== undefined && (
        <p className={`text-xs mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(2)}%
        </p>
      )}
    </div>
  );
};

// Table Component for breakdown data
const BreakdownTable = ({ title, data, groupKey, groupLabel }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{groupLabel}</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Mailers Sent</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Leads</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Contracts Sent</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Contracts Closed</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Response Rate</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Lead→Contract Rate</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Close Rate</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Closing Proceeds</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Avg/Contract</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Total Spent</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Cost/Lead</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Cost/Contract</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Total Margin</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{row[groupKey] || 'N/A'}</td>
                <td className="px-4 py-3 text-right">{formatNumber(row.totalMailersSent, 0)}</td>
                <td className="px-4 py-3 text-right">{formatNumber(row.totalLeads, 0)}</td>
                <td className="px-4 py-3 text-right">{formatNumber(row.totalContractsSent, 0)}</td>
                <td className="px-4 py-3 text-right">{formatNumber(row.totalContractsClosed, 0)}</td>
                <td className="px-4 py-3 text-right">{formatPercent(row.responseRate)}</td>
                <td className="px-4 py-3 text-right">{formatPercent(row.leadToContractSentRate)}</td>
                <td className="px-4 py-3 text-right">{formatPercent(row.contractSentToClosedRate)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(row.totalClosingProceeds)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(row.avgClosingProceedsPerContract)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(row.totalSpent)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(row.avgCostPerLead)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(row.avgCostPerContract)}</td>
                <td className={`px-4 py-3 text-right font-medium ${row.totalMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(row.totalMargin)}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${row.roas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(row.roas)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MailAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: '',
    state: '',
  });
  const [filterOptions, setFilterOptions] = useState({
    years: [],
    states: [],
  });

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await mailCampaignsApi.getFilterOptions();
      setFilterOptions({
        years: response.data.data.years || [],
        states: response.data.data.states || [],
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  }, []);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.year) params.year = filters.year;
      if (filters.state) params.state = filters.state;

      const response = await mailCampaignsApi.getAnalytics(params);
      setData(response.data.data);
    } catch (error) {
      toast.error('Error loading analytics: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ year: '', state: '' });
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  const overall = data?.overall || {};

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mail Campaign Analytics</h1>
          <p className="text-gray-600">Performance metrics and KPIs overview</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              className="form-select text-sm w-32"
            >
              <option value="">All Years</option>
              {filterOptions.years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select
              value={filters.state}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              className="form-select text-sm w-32"
            >
              <option value="">All States</option>
              {filterOptions.states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="btn btn-secondary btn-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Overall KPIs Summary */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <KpiCard
            title="Total Mailers Sent"
            value={formatNumber(overall.totalMailersSent, 0)}
            subtitle={`${overall.totalCampaigns || 0} campaigns`}
            color="blue"
          />
          <KpiCard
            title="Total Leads"
            value={formatNumber(overall.totalLeads, 0)}
            subtitle={`${formatPercent(overall.responseRate)} response rate`}
            color="purple"
          />
          <KpiCard
            title="Contracts Sent"
            value={formatNumber(overall.totalContractsSent, 0)}
            subtitle={`${formatPercent(overall.leadToContractSentRate)} of leads`}
            color="orange"
          />
          <KpiCard
            title="Contracts Closed"
            value={formatNumber(overall.totalContractsClosed, 0)}
            subtitle={`${formatPercent(overall.contractSentToClosedRate)} close rate`}
            color="green"
          />
          <KpiCard
            title="Total Proceeds"
            value={formatCurrency(overall.totalClosingProceeds)}
            subtitle={`${formatCurrency(overall.avgClosingProceedsPerContract)} avg/contract`}
            color="green"
          />
          <KpiCard
            title="Total Spent"
            value={formatCurrency(overall.totalSpent)}
            subtitle={`${formatCurrency(overall.avgCostPerLead)} per lead`}
            color="red"
          />
        </div>

        {/* Second row of KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
          <KpiCard
            title="Response Rate"
            value={formatPercent(overall.responseRate)}
            subtitle="Leads / Mailers"
            color="blue"
          />
          <KpiCard
            title="Lead to Contract Rate"
            value={formatPercent(overall.leadToContractSentRate)}
            subtitle="Contracts Sent / Leads"
            color="purple"
          />
          <KpiCard
            title="Close Rate"
            value={formatPercent(overall.contractSentToClosedRate)}
            subtitle="Closed / Sent"
            color="orange"
          />
          <KpiCard
            title="Total Margin"
            value={formatCurrency(overall.totalMargin)}
            subtitle={`${formatCurrency(overall.avgMarginPerContract)} per contract`}
            color={overall.totalMargin >= 0 ? 'green' : 'red'}
          />
          <KpiCard
            title="ROAS"
            value={formatPercent(overall.roas)}
            subtitle="Return on Ad Spend"
            color={(overall.roas || 0) >= 0 ? 'green' : 'red'}
          />
        </div>
      </div>

      {/* Breakdown by Entity */}
      <div className="mb-8">
        <BreakdownTable
          title="Performance by Entity"
          data={data?.byEntity}
          groupKey="entity"
          groupLabel="Entity"
        />
      </div>

      {/* Breakdown by Year */}
      <div className="mb-8">
        <BreakdownTable
          title="Performance by Year"
          data={data?.byYear}
          groupKey="year"
          groupLabel="Year"
        />
      </div>

      {/* Breakdown by State */}
      <div className="mb-8">
        <BreakdownTable
          title="Performance by State (Top 15)"
          data={data?.byState}
          groupKey="state"
          groupLabel="State"
        />
      </div>
    </div>
  );
};

export default MailAnalyticsPage;
