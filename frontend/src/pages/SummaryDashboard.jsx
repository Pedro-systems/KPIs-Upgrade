/**
 * Summary Dashboard - Comprehensive KPI Overview
 * Aggregates data from all campaign types and deals
 */

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { summaryApi } from '../services/api';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';

// ============================================
// HELPER COMPONENTS
// ============================================

// Status indicator for performance
const StatusBadge = ({ value, threshold, inverse = false }) => {
  let status = 'neutral';
  if (inverse) {
    status = value <= threshold ? 'good' : 'bad';
  } else {
    status = value >= threshold ? 'good' : 'bad';
  }

  const colors = {
    good: 'bg-green-100 text-green-800 border-green-200',
    bad: 'bg-red-100 text-red-800 border-red-200',
    neutral: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status]}`}>
      {status === 'good' ? '✓' : status === 'bad' ? '✗' : '•'}
    </span>
  );
};

// Metric Card with color coding
const MetricCard = ({ title, value, subtitle, target, trend, colorScheme = 'default', size = 'normal', highlight = false }) => {
  const schemes = {
    default: 'bg-white border-gray-200',
    success: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300',
    danger: 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300',
    warning: 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300',
    info: 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300',
    purple: 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-300',
    primary: 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-300',
  };

  const textColors = {
    default: 'text-gray-900',
    success: 'text-green-700',
    danger: 'text-red-700',
    warning: 'text-amber-700',
    info: 'text-blue-700',
    purple: 'text-purple-700',
    primary: 'text-indigo-700',
  };

  const sizeClasses = {
    small: 'p-3',
    normal: 'p-4',
    large: 'p-6',
  };

  return (
    <div className={`rounded-xl border-2 ${schemes[colorScheme]} ${sizeClasses[size]} ${highlight ? 'ring-2 ring-indigo-500 ring-offset-2' : ''} transition-all hover:shadow-lg`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${textColors[colorScheme]}`}>{value}</p>
      {subtitle && <p className="text-xs mt-1 text-gray-500">{subtitle}</p>}
      {target !== undefined && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-gray-400">Target: {target}</span>
          {trend !== undefined && (
            <span className={`text-xs font-medium ${trend >= 100 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 100 ? '✓' : `${trend.toFixed(0)}%`}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Progress bar for funnel visualization
const FunnelBar = ({ label, target, actual, percent, colorClass }) => {
  const isOnTrack = percent >= 80;
  const isWarning = percent >= 50 && percent < 80;
  const isDanger = percent < 50;

  const barColor = isOnTrack ? 'bg-green-500' : isWarning ? 'bg-amber-500' : 'bg-red-500';
  const bgColor = isOnTrack ? 'bg-green-100' : isWarning ? 'bg-amber-100' : 'bg-red-100';
  const textColor = isOnTrack ? 'text-green-700' : isWarning ? 'text-amber-700' : 'text-red-700';

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-bold ${textColor}`}>{percent.toFixed(1)}%</span>
      </div>
      <div className={`h-6 rounded-full ${bgColor} overflow-hidden`}>
        <div 
          className={`h-full ${barColor} rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        >
          {percent >= 20 && (
            <span className="text-xs font-medium text-white">
              {formatNumber(actual, 0)}
            </span>
          )}
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Actual: {formatNumber(actual, 0)}</span>
        <span>Target: {formatNumber(target, 0)}</span>
      </div>
    </div>
  );
};

// Channel comparison row
const ChannelRow = ({ channel, icon, data, targets }) => {
  const getStatusColor = (value, target, inverse = false) => {
    const ratio = value / target;
    if (inverse) {
      return ratio <= 1 ? 'text-green-600' : 'text-red-600';
    }
    return ratio >= 1 ? 'text-green-600' : ratio >= 0.8 ? 'text-amber-600' : 'text-red-600';
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 font-medium">
        <span className="mr-2">{icon}</span>
        {channel}
      </td>
      <td className="px-4 py-3 text-right">{formatNumber(data.totalOutreach, 0)}</td>
      <td className="px-4 py-3 text-right">{formatNumber(data.totalLeads, 0)}</td>
      <td className="px-4 py-3 text-right">{formatNumber(data.totalContractsSent, 0)}</td>
      <td className="px-4 py-3 text-right font-semibold">{formatNumber(data.totalContractsClosed, 0)}</td>
      <td className={`px-4 py-3 text-right font-medium ${getStatusColor(data.responseRate, targets?.responseRate || 1)}`}>
        {formatPercent(data.responseRate)}
      </td>
      <td className={`px-4 py-3 text-right font-medium ${getStatusColor(data.leadToContractSentRate, targets?.leadToContractRate || 1)}`}>
        {formatPercent(data.leadToContractSentRate)}
      </td>
      <td className={`px-4 py-3 text-right font-medium ${getStatusColor(data.contractSentToClosedRate, targets?.closeRate || 1)}`}>
        {formatPercent(data.contractSentToClosedRate)}
      </td>
      <td className={`px-4 py-3 text-right ${getStatusColor(data.avgCostPerLead, 50, true)}`}>
        {formatCurrency(data.avgCostPerLead)}
      </td>
      <td className={`px-4 py-3 text-right ${getStatusColor(data.avgCostPerContract, 5000, true)}`}>
        {formatCurrency(data.avgCostPerContract)}
      </td>
      <td className={`px-4 py-3 text-right font-medium ${data.avgMarginPerContract >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {formatCurrency(data.avgMarginPerContract)}
      </td>
      <td className={`px-4 py-3 text-right font-bold ${data.roas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {formatPercent(data.roas)}
      </td>
    </tr>
  );
};

// Deals table component
const DealsTable = ({ deals }) => {
  if (!deals) return null;

  const { byEntity, totals } = deals;
  const entities = Object.keys(byEntity || {});
  const statuses = ['SOLD', 'SELLER FINANCE', 'ASSIGNABLE CONTRACT', 'OWNED - CASH BUY'];

  const getStatusColor = (status) => {
    const colors = {
      'SOLD': 'bg-green-100 text-green-800',
      'SELLER FINANCE': 'bg-blue-100 text-blue-800',
      'ASSIGNABLE CONTRACT': 'bg-purple-100 text-purple-800',
      'OWNED - CASH BUY': 'bg-amber-100 text-amber-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <h3 className="text-lg font-bold text-gray-900">Deals by Entity & Type</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Entity</th>
              {statuses.map(status => (
                <th key={status} className="px-4 py-3 text-center font-semibold text-gray-700">
                  <span className={`inline-block px-2 py-1 rounded-lg text-xs ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-center font-bold text-gray-900 bg-gray-100">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {entities.map(entity => {
              const entityData = byEntity[entity] || {};
              const entityTotal = statuses.reduce((sum, s) => sum + (entityData[s] || 0), 0);
              return (
                <tr key={entity} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{entity}</td>
                  {statuses.map(status => (
                    <td key={status} className="px-4 py-3 text-center">
                      <span className={`inline-block min-w-[2rem] px-2 py-1 rounded-lg font-medium ${entityData[status] ? getStatusColor(status) : 'text-gray-400'}`}>
                        {entityData[status] || 0}
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center font-bold bg-gray-50">{entityTotal}</td>
                </tr>
              );
            })}
            <tr className="bg-gray-100 font-bold">
              <td className="px-4 py-3 text-gray-900">TOTAL</td>
              {statuses.map(status => (
                <td key={status} className="px-4 py-3 text-center">
                  <span className={`inline-block min-w-[2rem] px-2 py-1 rounded-lg ${getStatusColor(status)}`}>
                    {totals[status] || 0}
                  </span>
                </td>
              ))}
              <td className="px-4 py-3 text-center text-lg bg-indigo-100 text-indigo-800">
                {Object.values(totals || {}).reduce((a, b) => a + b, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const SummaryDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(2025);
  const [yearOptions, setYearOptions] = useState([]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await summaryApi.getFilterOptions();
      setYearOptions(response.data.data.years || []);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await summaryApi.getDashboard({ year });
      setData(response.data.data);
    } catch (error) {
      toast.error('Error loading dashboard: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  const { deals, channels, overall, funnel, financials, targets } = data || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Summary Dashboard</h1>
          <p className="text-gray-600">Comprehensive KPI overview across all channels</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="form-select text-sm font-medium"
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
            {!yearOptions.includes(year) && <option value={year}>{year}</option>}
          </select>
          <button
            onClick={fetchDashboard}
            className="btn btn-primary btn-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Financial Targets Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <h2 className="text-lg font-semibold mb-4 opacity-90">Financial Targets</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div>
            <p className="text-sm opacity-75">Net Proceeds 2024</p>
            <p className="text-2xl font-bold">{formatCurrency(financials?.netProceeds2024)}</p>
          </div>
          <div>
            <p className="text-sm opacity-75">Target Multiple</p>
            <p className="text-2xl font-bold">{financials?.targetMultiple}x</p>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="text-sm opacity-75">Target Proceeds {year}</p>
            <p className="text-2xl font-bold text-yellow-300">{formatCurrency(financials?.targetProceeds2025)}</p>
          </div>
          <div>
            <p className="text-sm opacity-75">Target Contracts</p>
            <p className="text-2xl font-bold">{financials?.targetContracts}</p>
          </div>
          <div>
            <p className="text-sm opacity-75">Avg Spread/Contract</p>
            <p className="text-2xl font-bold">{formatCurrency(financials?.averageSpreadPerContract)}</p>
          </div>
        </div>
        {/* YTD Progress */}
        <div className="mt-6 pt-4 border-t border-white/20">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm opacity-75">YTD Proceeds</p>
              <p className="text-xl font-bold">{formatCurrency(financials?.ytdProceeds)}</p>
              <p className="text-xs opacity-60">
                {financials?.targetProceeds2025 > 0 
                  ? `${((financials?.ytdProceeds / financials?.targetProceeds2025) * 100).toFixed(1)}% of target`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-75">YTD Spent</p>
              <p className="text-xl font-bold">{formatCurrency(financials?.ytdSpent)}</p>
            </div>
            <div>
              <p className="text-sm opacity-75">YTD Margin</p>
              <p className={`text-xl font-bold ${financials?.ytdMargin >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {formatCurrency(financials?.ytdMargin)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overall KPIs */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Overall Performance (All Channels Average)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <MetricCard
            title="Response Rate"
            value={formatPercent(overall?.responseRate)}
            colorScheme={overall?.responseRate >= 4 ? 'success' : overall?.responseRate >= 2 ? 'warning' : 'danger'}
          />
          <MetricCard
            title="Lead→Contract Rate"
            value={formatPercent(overall?.leadToContractSentRate)}
            colorScheme={overall?.leadToContractSentRate >= 50 ? 'success' : 'warning'}
          />
          <MetricCard
            title="Close Rate"
            value={formatPercent(overall?.contractSentToClosedRate)}
            colorScheme={overall?.contractSentToClosedRate >= 1 ? 'success' : 'warning'}
          />
          <MetricCard
            title="Avg Cost/Lead"
            value={formatCurrency(overall?.avgCostPerLead)}
            colorScheme={overall?.avgCostPerLead <= 30 ? 'success' : overall?.avgCostPerLead <= 50 ? 'warning' : 'danger'}
          />
          <MetricCard
            title="Avg Cost/Contract"
            value={formatCurrency(overall?.avgCostPerContract)}
            colorScheme={overall?.avgCostPerContract <= 2000 ? 'success' : overall?.avgCostPerContract <= 5000 ? 'warning' : 'danger'}
          />
          <MetricCard
            title="Avg Margin/Contract"
            value={formatCurrency(overall?.avgMarginPerContract)}
            colorScheme={overall?.avgMarginPerContract >= 5000 ? 'success' : overall?.avgMarginPerContract >= 0 ? 'warning' : 'danger'}
          />
          <MetricCard
            title="ROAS"
            value={formatPercent(overall?.roas)}
            colorScheme={overall?.roas >= 100 ? 'success' : overall?.roas >= 0 ? 'warning' : 'danger'}
            highlight={true}
          />
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Sales Funnel - {year}</h3>
          <FunnelBar
            label="Outreach Sent"
            target={funnel?.outreach?.target || 0}
            actual={funnel?.outreach?.actual || 0}
            percent={funnel?.outreach?.percentOfTarget || 0}
          />
          <FunnelBar
            label="Responses (Leads)"
            target={funnel?.leads?.target || 0}
            actual={funnel?.leads?.actual || 0}
            percent={funnel?.leads?.percentOfTarget || 0}
          />
          <FunnelBar
            label="Contracts Sent (Offers)"
            target={funnel?.contractsSent?.target || 0}
            actual={funnel?.contractsSent?.actual || 0}
            percent={funnel?.contractsSent?.percentOfTarget || 0}
          />
          <FunnelBar
            label="Contracts Closed"
            target={funnel?.contractsClosed?.target || 0}
            actual={funnel?.contractsClosed?.actual || 0}
            percent={funnel?.contractsClosed?.percentOfTarget || 0}
          />
        </div>

        {/* Deals Summary */}
        <DealsTable deals={deals} />
      </div>

      {/* Channel Comparison Table */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-lg font-bold text-gray-900">Channel Performance Comparison (All Time)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Channel</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Outreach</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Leads</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Contracts Sent</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Closed</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Response Rate</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Lead→Contract</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Close Rate</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Cost/Lead</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Cost/Contract</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Margin/Contract</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 bg-indigo-50">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {channels?.mail?.allTime && (
                <ChannelRow
                  channel="Direct Mail"
                  icon="✉️"
                  data={channels.mail.allTime}
                  targets={{ responseRate: targets?.mailResponseRate, leadToContractRate: targets?.mailLeadToContractRate, closeRate: targets?.mailCloseRate }}
                />
              )}
              {channels?.text?.allTime && (
                <ChannelRow
                  channel="SMS/Text"
                  icon="📱"
                  data={channels.text.allTime}
                  targets={{ responseRate: targets?.textResponseRate, leadToContractRate: targets?.textLeadToContractRate, closeRate: targets?.textCloseRate }}
                />
              )}
              {channels?.call?.allTime && (
                <ChannelRow
                  channel="Cold Calling"
                  icon="📞"
                  data={channels.call.allTime}
                  targets={{ responseRate: targets?.callResponseRate, leadToContractRate: targets?.callLeadToContractRate, closeRate: targets?.callCloseRate }}
                />
              )}
              {/* Overall Row */}
              <tr className="bg-indigo-50 font-bold border-t-2 border-indigo-200">
                <td className="px-4 py-3 text-indigo-900">
                  <span className="mr-2">📊</span>
                  OVERALL (Average)
                </td>
                <td className="px-4 py-3 text-right">{formatNumber(overall?.totalOutreach, 0)}</td>
                <td className="px-4 py-3 text-right">{formatNumber(overall?.totalLeads, 0)}</td>
                <td className="px-4 py-3 text-right">{formatNumber(overall?.totalContractsSent, 0)}</td>
                <td className="px-4 py-3 text-right">{formatNumber(overall?.totalContractsClosed, 0)}</td>
                <td className="px-4 py-3 text-right text-indigo-700">{formatPercent(overall?.responseRate)}</td>
                <td className="px-4 py-3 text-right text-indigo-700">{formatPercent(overall?.leadToContractSentRate)}</td>
                <td className="px-4 py-3 text-right text-indigo-700">{formatPercent(overall?.contractSentToClosedRate)}</td>
                <td className="px-4 py-3 text-right text-indigo-700">{formatCurrency(overall?.avgCostPerLead)}</td>
                <td className="px-4 py-3 text-right text-indigo-700">{formatCurrency(overall?.avgCostPerContract)}</td>
                <td className={`px-4 py-3 text-right ${overall?.avgMarginPerContract >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(overall?.avgMarginPerContract)}
                </td>
                <td className={`px-4 py-3 text-right text-lg ${overall?.roas >= 0 ? 'text-green-700' : 'text-red-700'} bg-indigo-100`}>
                  {formatPercent(overall?.roas)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* YTD Channel Performance */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-white">
          <h3 className="text-lg font-bold text-gray-900">Channel Performance - {year} YTD</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Channel</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Outreach</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Leads</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Contracts Sent</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Closed</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Closing Proceeds</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Total Spent</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Margin</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 bg-emerald-50">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {channels?.mail?.yearToDate && (
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">✉️ Direct Mail</td>
                  <td className="px-4 py-3 text-right">{formatNumber(channels.mail.yearToDate.totalOutreach, 0)}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(channels.mail.yearToDate.totalLeads, 0)}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(channels.mail.yearToDate.totalContractsSent, 0)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatNumber(channels.mail.yearToDate.totalContractsClosed, 0)}</td>
                  <td className="px-4 py-3 text-right text-green-600">{formatCurrency(channels.mail.yearToDate.totalClosingProceeds)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatCurrency(channels.mail.yearToDate.totalSpent)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${channels.mail.yearToDate.totalMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(channels.mail.yearToDate.totalMargin)}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${channels.mail.yearToDate.roas >= 0 ? 'text-green-600' : 'text-red-600'} bg-emerald-50`}>
                    {formatPercent(channels.mail.yearToDate.roas)}
                  </td>
                </tr>
              )}
              {channels?.text?.yearToDate && (
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">📱 SMS/Text</td>
                  <td className="px-4 py-3 text-right">{formatNumber(channels.text.yearToDate.totalOutreach, 0)}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(channels.text.yearToDate.totalLeads, 0)}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(channels.text.yearToDate.totalContractsSent, 0)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatNumber(channels.text.yearToDate.totalContractsClosed, 0)}</td>
                  <td className="px-4 py-3 text-right text-green-600">{formatCurrency(channels.text.yearToDate.totalClosingProceeds)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatCurrency(channels.text.yearToDate.totalSpent)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${channels.text.yearToDate.totalMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(channels.text.yearToDate.totalMargin)}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${channels.text.yearToDate.roas >= 0 ? 'text-green-600' : 'text-red-600'} bg-emerald-50`}>
                    {formatPercent(channels.text.yearToDate.roas)}
                  </td>
                </tr>
              )}
              {channels?.call?.yearToDate && (
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">📞 Cold Calling</td>
                  <td className="px-4 py-3 text-right">{formatNumber(channels.call.yearToDate.totalOutreach, 0)}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(channels.call.yearToDate.totalLeads, 0)}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(channels.call.yearToDate.totalContractsSent, 0)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatNumber(channels.call.yearToDate.totalContractsClosed, 0)}</td>
                  <td className="px-4 py-3 text-right text-green-600">{formatCurrency(channels.call.yearToDate.totalClosingProceeds)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatCurrency(channels.call.yearToDate.totalSpent)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${channels.call.yearToDate.totalMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(channels.call.yearToDate.totalMargin)}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${channels.call.yearToDate.roas >= 0 ? 'text-green-600' : 'text-red-600'} bg-emerald-50`}>
                    {formatPercent(channels.call.yearToDate.roas)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <h3 className="text-lg font-bold mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Best Performing Channel */}
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm opacity-75 mb-2">Best ROAS Channel</p>
            {channels && (() => {
              const channelRoas = [
                { name: 'SMS/Text', roas: channels.text?.allTime?.roas || 0, icon: '📱' },
                { name: 'Direct Mail', roas: channels.mail?.allTime?.roas || 0, icon: '✉️' },
                { name: 'Cold Calling', roas: channels.call?.allTime?.roas || 0, icon: '📞' },
              ].sort((a, b) => b.roas - a.roas)[0];
              return (
                <>
                  <p className="text-2xl font-bold">{channelRoas.icon} {channelRoas.name}</p>
                  <p className={`text-lg ${channelRoas.roas >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercent(channelRoas.roas)} ROAS
                  </p>
                </>
              );
            })()}
          </div>

          {/* Most Efficient for Leads */}
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm opacity-75 mb-2">Lowest Cost Per Lead</p>
            {channels && (() => {
              const channelCpl = [
                { name: 'SMS/Text', cpl: channels.text?.allTime?.avgCostPerLead || Infinity, icon: '📱' },
                { name: 'Direct Mail', cpl: channels.mail?.allTime?.avgCostPerLead || Infinity, icon: '✉️' },
                { name: 'Cold Calling', cpl: channels.call?.allTime?.avgCostPerLead || Infinity, icon: '📞' },
              ].sort((a, b) => a.cpl - b.cpl)[0];
              return (
                <>
                  <p className="text-2xl font-bold">{channelCpl.icon} {channelCpl.name}</p>
                  <p className="text-lg text-green-400">{formatCurrency(channelCpl.cpl)} per lead</p>
                </>
              );
            })()}
          </div>

          {/* Funnel Bottleneck */}
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm opacity-75 mb-2">Biggest Funnel Gap</p>
            {funnel && (() => {
              const stages = [
                { name: 'Outreach', percent: funnel.outreach?.percentOfTarget || 100 },
                { name: 'Leads', percent: funnel.leads?.percentOfTarget || 100 },
                { name: 'Contracts Sent', percent: funnel.contractsSent?.percentOfTarget || 100 },
                { name: 'Contracts Closed', percent: funnel.contractsClosed?.percentOfTarget || 100 },
              ].sort((a, b) => a.percent - b.percent)[0];
              return (
                <>
                  <p className="text-2xl font-bold">{stages.name}</p>
                  <p className={`text-lg ${stages.percent >= 80 ? 'text-green-400' : stages.percent >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {stages.percent.toFixed(1)}% of target
                  </p>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryDashboard;
