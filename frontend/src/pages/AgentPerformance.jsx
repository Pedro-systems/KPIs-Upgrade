/**
 * Agent Performance Page
 * Displays DataKPI metrics with daily, weekly, monthly views
 * and correlation with campaign pipeline
 */

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { datakpiApi, crossviewApi } from '../services/api';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';

// ============================================
// HELPER COMPONENTS
// ============================================

const MetricCard = ({ title, value, subtitle, colorScheme = 'default', size = 'normal' }) => {
  const schemes = {
    default: 'bg-white border-gray-200',
    success: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300',
    danger: 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300',
    warning: 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300',
    info: 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300',
    purple: 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-300',
  };

  const textColors = {
    default: 'text-gray-900',
    success: 'text-green-700',
    danger: 'text-red-700',
    warning: 'text-amber-700',
    info: 'text-blue-700',
    purple: 'text-purple-700',
  };

  const sizeClasses = {
    small: 'p-3',
    normal: 'p-4',
    large: 'p-6',
  };

  return (
    <div className={`rounded-xl border-2 ${schemes[colorScheme]} ${sizeClasses[size]} transition-all hover:shadow-lg`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${textColors[colorScheme]}`}>{value}</p>
      {subtitle && <p className="text-xs mt-1 text-gray-500">{subtitle}</p>}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const AgentPerformance = () => {
  const [activeTab, setActiveTab] = useState('monthly'); // daily, weekly, monthly, pipeline
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [year, setYear] = useState(2025);
  
  // Data states
  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [pipelineData, setPipelineData] = useState([]);

  // Fetch agents list
  const fetchAgents = useCallback(async () => {
    try {
      const response = await datakpiApi.getAgents();
      setAgents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  }, []);

  // Fetch daily data
  const fetchDaily = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (selectedAgent !== 'all') params.agent = selectedAgent;
      
      const response = await datakpiApi.getDaily(params);
      setDailyData(response.data.data || []);
    } catch (error) {
      toast.error('Erro ao carregar dados diários');
    } finally {
      setLoading(false);
    }
  }, [selectedAgent]);

  // Fetch weekly data
  const fetchWeekly = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100, year };
      if (selectedAgent !== 'all') params.agent = selectedAgent;
      
      const response = await datakpiApi.getWeekly(params);
      setWeeklyData(response.data.data || []);
    } catch (error) {
      toast.error('Erro ao carregar dados semanais');
    } finally {
      setLoading(false);
    }
  }, [selectedAgent, year]);

  // Fetch monthly data
  const fetchMonthly = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100, year };
      if (selectedAgent !== 'all') params.agent = selectedAgent;
      
      const response = await datakpiApi.getMonthly(params);
      setMonthlyData(response.data.data || []);
    } catch (error) {
      toast.error('Erro ao carregar dados mensais');
    } finally {
      setLoading(false);
    }
  }, [selectedAgent, year]);

  // Fetch pipeline correlation
  const fetchPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (selectedAgent !== 'all') params.agent = selectedAgent;
      
      const response = await crossviewApi.getAgentPipeline(params);
      setPipelineData(response.data.data || []);
    } catch (error) {
      toast.error('Erro ao carregar correlação com pipeline');
    } finally {
      setLoading(false);
    }
  }, [selectedAgent]);

  // Initial load
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Load data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case 'daily':
        fetchDaily();
        break;
      case 'weekly':
        fetchWeekly();
        break;
      case 'monthly':
        fetchMonthly();
        break;
      case 'pipeline':
        fetchPipeline();
        break;
      default:
        fetchMonthly();
    }
  }, [activeTab, fetchDaily, fetchWeekly, fetchMonthly, fetchPipeline]);

  // Calculate summary stats from agents
  const summary = {
    totalAgents: agents.length,
    totalContracts: agents.reduce((sum, a) => sum + (parseInt(a.total_signed_contracts) || 0), 0),
    totalOffers: agents.reduce((sum, a) => sum + (parseInt(a.total_offers_sent) || 0), 0),
    totalHotLeads: agents.reduce((sum, a) => sum + (parseInt(a.total_hot_leads) || 0), 0),
    avgCloseRate: agents.length > 0 
      ? agents.reduce((sum, a) => sum + (parseFloat(a.avg_close_rate) || 0), 0) / agents.length 
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Performance de Agentes</h1>
          <p className="text-gray-600">Métricas de atividade e resultados (DataKPI)</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="form-select text-sm font-medium"
          >
            <option value="all">Todos os Agentes</option>
            {agents.map(agent => (
              <option key={agent.agent_name} value={agent.agent_name}>
                {agent.agent_name}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="form-select text-sm font-medium"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          title="Total Agentes"
          value={summary.totalAgents}
          colorScheme="info"
        />
        <MetricCard
          title="Contratos Assinados"
          value={formatNumber(summary.totalContracts, 0)}
          subtitle="All time"
          colorScheme="success"
        />
        <MetricCard
          title="Ofertas Enviadas"
          value={formatNumber(summary.totalOffers, 0)}
          subtitle="All time"
          colorScheme="purple"
        />
        <MetricCard
          title="Hot Leads"
          value={formatNumber(summary.totalHotLeads, 0)}
          subtitle="All time"
          colorScheme="warning"
        />
        <MetricCard
          title="Close Rate Médio"
          value={formatPercent(summary.avgCloseRate * 100)}
          subtitle="Todos agentes"
          colorScheme="info"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'monthly'
                  ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📅 Mensal
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'weekly'
                  ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📆 Semanal
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'daily'
                  ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📋 Diário
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'pipeline'
                  ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🔗 vs Pipeline
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner"></div>
              <span className="ml-3 text-gray-600">Carregando dados...</span>
            </div>
          ) : (
            <>
              {/* Monthly View */}
              {activeTab === 'monthly' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Agente</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Mês</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">SMS</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Cold Calls</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Hot Leads</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Ofertas</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 bg-green-50">Contratos</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Close Rate</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Dias Ativos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{row.agent_name}</td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {new Date(row.month).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-4 py-3 text-right">{formatNumber(row.total_sms_sent, 0)}</td>
                          <td className="px-4 py-3 text-right">{formatNumber(row.total_cold_calls, 0)}</td>
                          <td className="px-4 py-3 text-right text-amber-600">{formatNumber(row.total_hot_leads, 0)}</td>
                          <td className="px-4 py-3 text-right text-purple-600">{formatNumber(row.total_offers_sent, 0)}</td>
                          <td className="px-4 py-3 text-right font-bold text-green-600 bg-green-50">
                            {formatNumber(row.total_signed_contracts, 0)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {row.avg_close_rate ? formatPercent(row.avg_close_rate * 100) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">{row.days_active || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {monthlyData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum dado encontrado para o filtro selecionado
                    </div>
                  )}
                </div>
              )}

              {/* Weekly View */}
              {activeTab === 'weekly' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Agente</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Semana</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">SMS</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Cold Calls</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Hot Leads</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Ofertas</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 bg-green-50">Contratos</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Dias Ativos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyData.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{row.agent_name}</td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            Sem {row.week_number} • {new Date(row.week_start).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-right">{formatNumber(row.total_sms_sent, 0)}</td>
                          <td className="px-4 py-3 text-right">{formatNumber(row.total_cold_calls, 0)}</td>
                          <td className="px-4 py-3 text-right text-amber-600">{formatNumber(row.total_hot_leads, 0)}</td>
                          <td className="px-4 py-3 text-right text-purple-600">{formatNumber(row.total_offers_sent, 0)}</td>
                          <td className="px-4 py-3 text-right font-bold text-green-600 bg-green-50">
                            {formatNumber(row.total_signed_contracts, 0)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">{row.days_active || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {weeklyData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum dado encontrado para o filtro selecionado
                    </div>
                  )}
                </div>
              )}

              {/* Daily View */}
              {activeTab === 'daily' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Agente</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Data</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">SMS</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Cold Calls</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Hot Leads</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Ofertas</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700 bg-green-50">Contratos</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Close Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyData.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{row.agent_name}</td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {new Date(row.activity_date).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-right">{formatNumber(row.sms_sent, 0)}</td>
                          <td className="px-4 py-3 text-right">{formatNumber(row.cold_calls_made, 0)}</td>
                          <td className="px-4 py-3 text-right text-amber-600">{formatNumber(row.hot_leads, 0)}</td>
                          <td className="px-4 py-3 text-right text-purple-600">{formatNumber(row.offers_sent, 0)}</td>
                          <td className="px-4 py-3 text-right font-bold text-green-600 bg-green-50">
                            {formatNumber(row.signed_contracts, 0)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {row.close_rate ? formatPercent(row.close_rate) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {dailyData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum dado encontrado para o filtro selecionado
                    </div>
                  )}
                </div>
              )}

              {/* Pipeline Correlation View */}
              {activeTab === 'pipeline' && (
                <div>
                  <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-800 font-medium">
                      ⚠️ Importante: Esta correlação é temporal (mesmo mês). 
                      Agentes NÃO estão diretamente linkados a campanhas específicas.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Agente</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700">Mês</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Ofertas</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700 bg-green-50">Contratos</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700">Close Rate</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700 bg-purple-50">Leads Pipeline</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700 bg-purple-50">Custo Pipeline</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700 bg-purple-50">Custo/Contrato</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-700 bg-purple-50">ROI Est.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pipelineData.map((row, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{row.agent_name}</td>
                            <td className="px-4 py-3 text-center text-gray-600">
                              {new Date(row.month).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' })}
                            </td>
                            <td className="px-4 py-3 text-right">{formatNumber(row.total_offers_sent, 0)}</td>
                            <td className="px-4 py-3 text-right font-bold text-green-600 bg-green-50">
                              {formatNumber(row.total_signed_contracts, 0)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {row.avg_close_rate ? formatPercent(row.avg_close_rate * 100) : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-right bg-purple-50">{formatNumber(row.pipeline_leads_same_month, 0)}</td>
                            <td className="px-4 py-3 text-right bg-purple-50">{formatCurrency(row.pipeline_cost_same_month)}</td>
                            <td className="px-4 py-3 text-right bg-purple-50 font-medium">
                              {row.est_cost_per_signed_contract ? formatCurrency(row.est_cost_per_signed_contract) : 'N/A'}
                            </td>
                            <td className={`px-4 py-3 text-right bg-purple-50 font-bold ${
                              row.est_roi_percent > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {row.est_roi_percent ? formatPercent(row.est_roi_percent) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {pipelineData.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Nenhum dado encontrado para o filtro selecionado
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentPerformance;
