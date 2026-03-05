/**
 * Summary Dashboard Routes
 * Aggregates KPIs from all campaign types and deals
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// ============================================
// CONFIGURATION (Business targets)
// ============================================

const TARGETS = {
  netProceeds2024: 371703,
  targetMultiple: 5,
  averageSpreadPerContract: 30000,
  // Response rates targets
  mailResponseRate: 2.5,
  textResponseRate: 11.0,
  callResponseRate: 2.0,
  // Lead to contract sent targets
  mailLeadToContractRate: 33.0,
  textLeadToContractRate: 19.0,
  callLeadToContractRate: 44.0,
  // Close rate targets
  mailCloseRate: 1.25,
  textCloseRate: 2.5,
  callCloseRate: 0.5,
};

// Calculate target proceeds from 2024 * multiple
const getTargetProceeds2025 = () => TARGETS.netProceeds2024 * TARGETS.targetMultiple;
// Calculate target contracts from proceeds / spread
const getTargetContracts = () => Math.round(getTargetProceeds2025() / TARGETS.averageSpreadPerContract);

/**
 * GET /api/summary/dashboard
 * Returns comprehensive dashboard data aggregating all sources
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    const { year = 2025 } = req.query;
    const yearInt = parseInt(year);

    // ========================================
    // 1. DEALS BY ENTITY AND STATUS
    // ========================================
    const dealsQuery = `
      SELECT 
        COALESCE(entity, 'Unknown') as entity,
        COALESCE(status, 'Unknown') as status,
        COUNT(*) as count
      FROM deals
      GROUP BY entity, status
      ORDER BY entity, status
    `;
    
    const dealsTotalQuery = `
      SELECT 
        COALESCE(status, 'Unknown') as status,
        COUNT(*) as count
      FROM deals
      GROUP BY status
      ORDER BY status
    `;

    // ========================================
    // 2. MAIL CAMPAIGN KPIs (for specific year)
    // ========================================
    const mailQuery = `
      SELECT 
        COALESCE(SUM(campaign_size), 0) as total_mailers_sent,
        COALESCE(SUM(num_leads_generated), 0) as total_leads,
        COALESCE(SUM(num_contracts_sent), 0) as total_contracts_sent,
        COALESCE(SUM(num_contracts_closed), 0) as total_contracts_closed,
        COALESCE(SUM(total_closing_proceeds), 0) as total_closing_proceeds,
        COALESCE(SUM(campaign_cost), 0) as total_spent,
        COALESCE(SUM(margin_earned), 0) as total_margin,
        COUNT(*) as total_campaigns,
        COALESCE(AVG(average_cost_per_lead), 0) as avg_cost_per_lead,
        COALESCE(AVG(average_cost_per_contract), 0) as avg_cost_per_contract,
        COALESCE(AVG(average_margin_per_contract), 0) as avg_margin_per_contract
      FROM mail_campaigns
      WHERE year = $1
    `;

    const mailAllTimeQuery = `
      SELECT 
        COALESCE(SUM(campaign_size), 0) as total_mailers_sent,
        COALESCE(SUM(num_leads_generated), 0) as total_leads,
        COALESCE(SUM(num_contracts_sent), 0) as total_contracts_sent,
        COALESCE(SUM(num_contracts_closed), 0) as total_contracts_closed,
        COALESCE(SUM(total_closing_proceeds), 0) as total_closing_proceeds,
        COALESCE(SUM(campaign_cost), 0) as total_spent,
        COALESCE(SUM(margin_earned), 0) as total_margin,
        COUNT(*) as total_campaigns,
        COALESCE(AVG(average_cost_per_lead), 0) as avg_cost_per_lead,
        COALESCE(AVG(average_cost_per_contract), 0) as avg_cost_per_contract,
        COALESCE(AVG(average_margin_per_contract), 0) as avg_margin_per_contract
      FROM mail_campaigns
    `;

    // ========================================
    // 3. TEXT/SMS CAMPAIGN KPIs (for specific year)
    // ========================================
    const textQuery = `
      SELECT 
        COALESCE(SUM(campaign_size), 0) as total_prospects,
        COALESCE(SUM(messages_delivered), 0) as total_messages_delivered,
        COALESCE(SUM(num_responses), 0) as total_responses,
        COALESCE(SUM(num_leads_generated), 0) as total_leads,
        COALESCE(SUM(num_contracts_sent), 0) as total_contracts_sent,
        COALESCE(SUM(num_contracts_closed), 0) as total_contracts_closed,
        COALESCE(SUM(total_closing_proceeds), 0) as total_closing_proceeds,
        COALESCE(SUM(campaign_cost), 0) as total_spent,
        COALESCE(SUM(margin_earned), 0) as total_margin,
        COALESCE(AVG(average_cost_per_lead), 0) as avg_cost_per_lead,
        COALESCE(AVG(average_cost_per_contract), 0) as avg_cost_per_contract,
        COUNT(*) as total_campaigns
      FROM campaigns
      WHERE year = $1
    `;

    const textAllTimeQuery = `
      SELECT 
        COALESCE(SUM(campaign_size), 0) as total_prospects,
        COALESCE(SUM(messages_delivered), 0) as total_messages_delivered,
        COALESCE(SUM(num_responses), 0) as total_responses,
        COALESCE(SUM(num_leads_generated), 0) as total_leads,
        COALESCE(SUM(num_contracts_sent), 0) as total_contracts_sent,
        COALESCE(SUM(num_contracts_closed), 0) as total_contracts_closed,
        COALESCE(SUM(total_closing_proceeds), 0) as total_closing_proceeds,
        COALESCE(SUM(campaign_cost), 0) as total_spent,
        COALESCE(SUM(margin_earned), 0) as total_margin,
        COALESCE(AVG(average_cost_per_lead), 0) as avg_cost_per_lead,
        COALESCE(AVG(average_cost_per_contract), 0) as avg_cost_per_contract,
        COUNT(*) as total_campaigns
      FROM campaigns
    `;

    // ========================================
    // 4. CALL CAMPAIGN KPIs (for specific year)
    // ========================================
    const callQuery = `
      SELECT 
        COALESCE(SUM(campaign_size), 0) as total_calls_made,
        COALESCE(SUM(leads_generated), 0) as total_leads,
        COALESCE(SUM(num_contracts_sent), 0) as total_contracts_sent,
        COALESCE(SUM(num_contracts_closed), 0) as total_contracts_closed,
        COALESCE(SUM(total_closing_proceeds), 0) as total_closing_proceeds,
        COALESCE(SUM(campaign_cost), 0) as total_spent,
        COALESCE(SUM(margin_earned), 0) as total_margin,
        COUNT(*) as total_campaigns,
        COALESCE(AVG(average_cost_per_lead), 0) as avg_cost_per_lead,
        COALESCE(AVG(average_cost_per_contract), 0) as avg_cost_per_contract,
        COALESCE(AVG(average_margin_per_contract), 0) as avg_margin_per_contract
      FROM call_campaigns
      WHERE year = $1
    `;

    const callAllTimeQuery = `
      SELECT 
        COALESCE(SUM(campaign_size), 0) as total_calls_made,
        COALESCE(SUM(leads_generated), 0) as total_leads,
        COALESCE(SUM(num_contracts_sent), 0) as total_contracts_sent,
        COALESCE(SUM(num_contracts_closed), 0) as total_contracts_closed,
        COALESCE(SUM(total_closing_proceeds), 0) as total_closing_proceeds,
        COALESCE(SUM(campaign_cost), 0) as total_spent,
        COALESCE(SUM(margin_earned), 0) as total_margin,
        COUNT(*) as total_campaigns,
        COALESCE(AVG(average_cost_per_lead), 0) as avg_cost_per_lead,
        COALESCE(AVG(average_cost_per_contract), 0) as avg_cost_per_contract,
        COALESCE(AVG(average_margin_per_contract), 0) as avg_margin_per_contract
      FROM call_campaigns
    `;

    // Execute all queries in parallel with error handling
    const safeQuery = async (sql, params = []) => {
      try {
        return await query(sql, params);
      } catch (error) {
        console.error('Query error:', error.message);
        return { rows: [] };
      }
    };

    const [
      dealsResult,
      dealsTotalResult,
      mailYearResult,
      mailAllResult,
      textYearResult,
      textAllResult,
      callYearResult,
      callAllResult,
    ] = await Promise.all([
      safeQuery(dealsQuery),
      safeQuery(dealsTotalQuery),
      safeQuery(mailQuery, [yearInt]),
      safeQuery(mailAllTimeQuery),
      safeQuery(textQuery, [yearInt]),
      safeQuery(textAllTimeQuery),
      safeQuery(callQuery, [yearInt]),
      safeQuery(callAllTimeQuery),
    ]);

    // ========================================
    // TRANSFORM DEALS DATA
    // ========================================
    const dealsByEntity = {};
    dealsResult.rows.forEach(row => {
      if (!dealsByEntity[row.entity]) {
        dealsByEntity[row.entity] = {};
      }
      dealsByEntity[row.entity][row.status] = parseInt(row.count);
    });

    const dealsTotals = {};
    dealsTotalResult.rows.forEach(row => {
      dealsTotals[row.status] = parseInt(row.count);
    });

    // ========================================
    // CALCULATE CHANNEL KPIs
    // ========================================
    const emptyRow = {
      total_mailers_sent: 0, total_leads: 0, total_contracts_sent: 0,
      total_contracts_closed: 0, total_closing_proceeds: 0, total_spent: 0,
      total_margin: 0, total_campaigns: 0, total_calls_made: 0,
      total_prospects: 0, total_messages_delivered: 0, total_responses: 0,
      avg_cost_per_lead: 0, avg_cost_per_contract: 0,
    };

    const mailData = mailAllResult.rows[0] || emptyRow;
    const textData = textAllResult.rows[0] || emptyRow;
    const callData = callAllResult.rows[0] || emptyRow;

    const mailYearData = mailYearResult.rows[0] || emptyRow;
    const textYearData = textYearResult.rows[0] || emptyRow;
    const callYearData = callYearResult.rows[0] || emptyRow;

    // Calculate MAIL KPIs
    const mailKpis = calculateMailKpis(mailData);
    const mailYearKpis = calculateMailKpis(mailYearData);

    // Calculate TEXT KPIs
    const textKpis = calculateTextKpis(textData);
    const textYearKpis = calculateTextKpis(textYearData);

    // Calculate CALL KPIs
    const callKpis = calculateCallKpis(callData);
    const callYearKpis = calculateCallKpis(callYearData);

    // ========================================
    // CALCULATE OVERALL AVERAGES
    // ========================================
    const overallKpis = calculateOverallKpis(mailKpis, textKpis, callKpis);

    // ========================================
    // CALCULATE FUNNEL DATA (for specific year)
    // ========================================
    const targetContracts = getTargetContracts();
    const targetProceeds = getTargetProceeds2025();

    // Calculate funnel targets backward from contracts
    // Contracts Closed = Target
    // Contracts Sent = Contracts Closed / Close Rate
    // Leads = Contracts Sent / Lead to Contract Rate
    // Outreach = Leads / Response Rate

    // Using weighted average rates for target calculation
    const avgResponseRate = (TARGETS.mailResponseRate + TARGETS.textResponseRate + TARGETS.callResponseRate) / 3 / 100;
    const avgLeadToContractRate = (TARGETS.mailLeadToContractRate + TARGETS.textLeadToContractRate + TARGETS.callLeadToContractRate) / 3 / 100;
    const avgCloseRate = (TARGETS.mailCloseRate + TARGETS.textCloseRate + TARGETS.callCloseRate) / 3 / 100;

    const targetContractsSent = Math.round(targetContracts / avgCloseRate);
    const targetLeads = Math.round(targetContractsSent / avgLeadToContractRate);
    const targetOutreach = Math.round(targetLeads / avgResponseRate);

    // Actual values from year data
    const actualOutreach = 
      parseFloat(mailYearData.total_mailers_sent || 0) + 
      parseFloat(textYearData.total_messages_delivered || 0) + 
      parseFloat(callYearData.total_calls_made || 0);

    const actualLeads = 
      parseFloat(mailYearData.total_leads || 0) + 
      parseFloat(textYearData.total_leads || 0) + 
      parseFloat(callYearData.total_leads || 0);

    const actualContractsSent = 
      parseFloat(mailYearData.total_contracts_sent || 0) + 
      parseFloat(textYearData.total_contracts_sent || 0) + 
      parseFloat(callYearData.total_contracts_sent || 0);

    const actualContractsClosed = 
      parseFloat(mailYearData.total_contracts_closed || 0) + 
      parseFloat(textYearData.total_contracts_closed || 0) + 
      parseFloat(callYearData.total_contracts_closed || 0);

    const funnelData = {
      outreach: {
        target: targetOutreach,
        actual: actualOutreach,
        percentOfTarget: targetOutreach > 0 ? (actualOutreach / targetOutreach) * 100 : 0,
      },
      leads: {
        target: targetLeads,
        actual: actualLeads,
        percentOfTarget: targetLeads > 0 ? (actualLeads / targetLeads) * 100 : 0,
      },
      contractsSent: {
        target: targetContractsSent,
        actual: actualContractsSent,
        percentOfTarget: targetContractsSent > 0 ? (actualContractsSent / targetContractsSent) * 100 : 0,
      },
      contractsClosed: {
        target: targetContracts,
        actual: actualContractsClosed,
        percentOfTarget: targetContracts > 0 ? (actualContractsClosed / targetContracts) * 100 : 0,
      },
    };

    // ========================================
    // FINANCIAL SUMMARY
    // ========================================
    const financials = {
      netProceeds2024: TARGETS.netProceeds2024,
      targetMultiple: TARGETS.targetMultiple,
      targetProceeds2025: targetProceeds,
      averageSpreadPerContract: TARGETS.averageSpreadPerContract,
      targetContracts: targetContracts,
      // Year to date
      ytdProceeds: 
        parseFloat(mailYearData.total_closing_proceeds || 0) + 
        parseFloat(textYearData.total_closing_proceeds || 0) + 
        parseFloat(callYearData.total_closing_proceeds || 0),
      ytdSpent:
        parseFloat(mailYearData.total_spent || 0) + 
        parseFloat(textYearData.total_spent || 0) + 
        parseFloat(callYearData.total_spent || 0),
      ytdMargin:
        parseFloat(mailYearData.total_margin || 0) + 
        parseFloat(textYearData.total_margin || 0) + 
        parseFloat(callYearData.total_margin || 0),
    };

    res.json({
      success: true,
      data: {
        year: yearInt,
        deals: {
          byEntity: dealsByEntity,
          totals: dealsTotals,
        },
        channels: {
          mail: {
            allTime: mailKpis,
            yearToDate: mailYearKpis,
          },
          text: {
            allTime: textKpis,
            yearToDate: textYearKpis,
          },
          call: {
            allTime: callKpis,
            yearToDate: callYearKpis,
          },
        },
        overall: overallKpis,
        funnel: funnelData,
        financials,
        targets: TARGETS,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateMailKpis(data) {
  const totalMailersSent = parseFloat(data.total_mailers_sent) || 0;
  const totalLeads = parseFloat(data.total_leads) || 0;
  const totalContractsSent = parseFloat(data.total_contracts_sent) || 0;
  const totalContractsClosed = parseFloat(data.total_contracts_closed) || 0;
  const totalClosingProceeds = parseFloat(data.total_closing_proceeds) || 0;
  const totalSpent = parseFloat(data.total_spent) || 0;
  const totalMargin = parseFloat(data.total_margin) || 0;
  // AVG of per-row values (matching CSV AVERAGEIF formula)
  const avgCostPerLead = parseFloat(data.avg_cost_per_lead) || 0;
  const avgCostPerContract = parseFloat(data.avg_cost_per_contract) || 0;
  const avgMarginPerContract = parseFloat(data.avg_margin_per_contract) || 0;

  return {
    totalOutreach: totalMailersSent,
    totalLeads,
    totalContractsSent,
    totalContractsClosed,
    totalClosingProceeds,
    totalSpent,
    totalMargin,
    responseRate: totalMailersSent > 0 ? (totalLeads / totalMailersSent) * 100 : 0,
    leadToContractSentRate: totalLeads > 0 ? (totalContractsSent / totalLeads) * 100 : 0,
    contractSentToClosedRate: totalContractsSent > 0 ? (totalContractsClosed / totalContractsSent) * 100 : 0,
    avgClosingProceedsPerContract: totalContractsClosed > 0 ? totalClosingProceeds / totalContractsClosed : 0,
    avgCostPerLead,
    avgCostPerContract,
    avgMarginPerContract,
    roas: totalSpent > 0 ? (totalMargin / totalSpent) * 100 : 0,
  };
}

function calculateTextKpis(data) {
  const totalMessagesDelivered = parseFloat(data.total_messages_delivered) || 0;
  const totalResponses = parseFloat(data.total_responses) || 0;
  const totalLeads = parseFloat(data.total_leads) || 0;
  const totalContractsSent = parseFloat(data.total_contracts_sent) || 0;
  const totalContractsClosed = parseFloat(data.total_contracts_closed) || 0;
  const totalClosingProceeds = parseFloat(data.total_closing_proceeds) || 0;
  const totalSpent = parseFloat(data.total_spent) || 0;
  const totalMargin = parseFloat(data.total_margin) || 0;
  // TEXT uses AVG for cost per lead/contract
  const avgCostPerLead = parseFloat(data.avg_cost_per_lead) || 0;
  const avgCostPerContract = parseFloat(data.avg_cost_per_contract) || 0;

  return {
    totalOutreach: totalMessagesDelivered,
    totalResponses,
    totalLeads,
    totalContractsSent,
    totalContractsClosed,
    totalClosingProceeds,
    totalSpent,
    totalMargin,
    responseRate: totalMessagesDelivered > 0 ? (totalResponses / totalMessagesDelivered) * 100 : 0,
    responseToLeadRate: totalResponses > 0 ? (totalLeads / totalResponses) * 100 : 0,
    leadToContractSentRate: totalLeads > 0 ? (totalContractsSent / totalLeads) * 100 : 0,
    contractSentToClosedRate: totalContractsSent > 0 ? (totalContractsClosed / totalContractsSent) * 100 : 0,
    avgClosingProceedsPerContract: totalContractsClosed > 0 ? totalClosingProceeds / totalContractsClosed : 0,
    avgCostPerLead,
    avgCostPerContract,
    avgMarginPerContract: totalContractsClosed > 0 ? totalMargin / totalContractsClosed : 0,
    roas: totalSpent > 0 ? (totalMargin / totalSpent) * 100 : 0,
  };
}

function calculateCallKpis(data) {
  const totalCallsMade = parseFloat(data.total_calls_made) || 0;
  const totalLeads = parseFloat(data.total_leads) || 0;
  const totalContractsSent = parseFloat(data.total_contracts_sent) || 0;
  const totalContractsClosed = parseFloat(data.total_contracts_closed) || 0;
  const totalClosingProceeds = parseFloat(data.total_closing_proceeds) || 0;
  const totalSpent = parseFloat(data.total_spent) || 0;
  const totalMargin = parseFloat(data.total_margin) || 0;
  // AVG of per-row values (matching CSV AVERAGEIF formula)
  const avgCostPerLead = parseFloat(data.avg_cost_per_lead) || 0;
  const avgCostPerContract = parseFloat(data.avg_cost_per_contract) || 0;
  const avgMarginPerContract = parseFloat(data.avg_margin_per_contract) || 0;

  return {
    totalOutreach: totalCallsMade,
    totalLeads,
    totalContractsSent,
    totalContractsClosed,
    totalClosingProceeds,
    totalSpent,
    totalMargin,
    responseRate: totalCallsMade > 0 ? (totalLeads / totalCallsMade) * 100 : 0,
    leadToContractSentRate: totalLeads > 0 ? (totalContractsSent / totalLeads) * 100 : 0,
    contractSentToClosedRate: totalContractsSent > 0 ? (totalContractsClosed / totalContractsSent) * 100 : 0,
    avgClosingProceedsPerContract: totalContractsClosed > 0 ? totalClosingProceeds / totalContractsClosed : 0,
    avgCostPerLead,
    avgCostPerContract,
    avgMarginPerContract,
    roas: totalSpent > 0 ? (totalMargin / totalSpent) * 100 : 0,
  };
}

function calculateOverallKpis(mail, text, call) {
  // Calculate averages across all three channels (as per spreadsheet formulas)
  const avg = (a, b, c) => (a + b + c) / 3;

  return {
    responseRate: avg(mail.responseRate, text.responseRate, call.responseRate),
    leadToContractSentRate: avg(mail.leadToContractSentRate, text.leadToContractSentRate, call.leadToContractSentRate),
    contractSentToClosedRate: avg(mail.contractSentToClosedRate, text.contractSentToClosedRate, call.contractSentToClosedRate),
    avgCostPerLead: avg(mail.avgCostPerLead, text.avgCostPerLead, call.avgCostPerLead),
    avgCostPerContract: avg(mail.avgCostPerContract, text.avgCostPerContract, call.avgCostPerContract),
    avgMarginPerContract: avg(mail.avgMarginPerContract, text.avgMarginPerContract, call.avgMarginPerContract),
    roas: avg(mail.roas, text.roas, call.roas),
    // Totals across all channels
    totalOutreach: mail.totalOutreach + text.totalOutreach + call.totalOutreach,
    totalLeads: mail.totalLeads + text.totalLeads + call.totalLeads,
    totalContractsSent: mail.totalContractsSent + text.totalContractsSent + call.totalContractsSent,
    totalContractsClosed: mail.totalContractsClosed + text.totalContractsClosed + call.totalContractsClosed,
    totalClosingProceeds: mail.totalClosingProceeds + text.totalClosingProceeds + call.totalClosingProceeds,
    totalSpent: mail.totalSpent + text.totalSpent + call.totalSpent,
    totalMargin: mail.totalMargin + text.totalMargin + call.totalMargin,
  };
}

/**
 * GET /api/summary/filters/options
 * Returns available years for filtering
 */
router.get('/filters/options', async (req, res, next) => {
  try {
    const yearsQuery = `
      SELECT DISTINCT year FROM (
        SELECT year FROM mail_campaigns WHERE year IS NOT NULL
        UNION
        SELECT year FROM campaigns WHERE year IS NOT NULL
        UNION
        SELECT year FROM call_campaigns WHERE year IS NOT NULL
      ) AS all_years
      ORDER BY year DESC
    `;

    const yearsResult = await query(yearsQuery);

    res.json({
      success: true,
      data: {
        years: yearsResult.rows.map(r => r.year),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
