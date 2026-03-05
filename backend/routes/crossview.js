/**
 * Rotas para Cross-View Analysis
 * Combina dados de diferentes fontes através das views
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// ============================================
// ROTAS
// ============================================

/**
 * GET /api/crossview/overview
 * Retorna visão geral do dashboard com todos os KPIs principais
 */
router.get('/overview', async (req, res, next) => {
  try {
    const sql = 'SELECT * FROM v_dashboard_overview';
    const result = await query(sql);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          total_signed_contracts: 0,
          total_offers_sent: 0,
          total_hot_leads: 0,
          total_agents: 0,
          total_leads_all_channels: 0,
          total_campaign_spend: 0,
          total_campaigns: 0,
          total_deals_profit: 0,
          total_expenses: 0,
          total_deals: 0,
          last_updated: null,
        },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/crossview/agent-pipeline
 * Retorna correlação temporal entre performance de agentes e pipeline de campanhas
 * NOTE: Esta é uma correlação temporal apenas (mesmo mês/ano)
 * NÃO indica atribuição direta de agente a campanha
 * Query params: ?agent=nome, ?from=YYYY-MM, ?to=YYYY-MM
 */
router.get('/agent-pipeline', async (req, res, next) => {
  try {
    const { agent, from, to, limit = 100 } = req.query;

    let sql = 'SELECT * FROM v_agent_vs_pipeline WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (agent) {
      paramCount++;
      sql += ` AND agent_name ILIKE $${paramCount}`;
      params.push(`%${agent}%`);
    }

    if (from) {
      // from format: YYYY-MM
      paramCount++;
      sql += ` AND month >= $${paramCount}`;
      params.push(from + '-01');
    }

    if (to) {
      // to format: YYYY-MM
      paramCount++;
      sql += ` AND month <= $${paramCount}`;
      params.push(to + '-01');
    }

    sql += ' ORDER BY month DESC, agent_name';
    
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      note: 'This data shows temporal correlation only. Agents are not directly linked to specific campaigns.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/crossview/financial
 * Retorna resumo financeiro mensal (despesas + deals)
 * Query params: ?entity=nome, ?year=2025
 */
router.get('/financial', async (req, res, next) => {
  try {
    const { entity, year, limit = 100 } = req.query;

    let sql = 'SELECT * FROM v_financial_monthly WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (entity) {
      paramCount++;
      sql += ` AND entity ILIKE $${paramCount}`;
      params.push(`%${entity}%`);
    }

    if (year) {
      paramCount++;
      sql += ` AND year = $${paramCount}`;
      params.push(parseInt(year));
    }

    sql += ' ORDER BY year DESC, month DESC, entity';
    
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/crossview/channel-comparison
 * Compara KPIs entre os 3 canais de campanha
 * Query params: ?year=2025, ?entity=nome
 */
router.get('/channel-comparison', async (req, res, next) => {
  try {
    const { year, entity } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (year) {
      paramCount++;
      whereClause += ` AND year = $${paramCount}`;
      params.push(parseInt(year));
    }

    if (entity) {
      paramCount++;
      whereClause += ` AND entity ILIKE $${paramCount}`;
      params.push(`%${entity}%`);
    }

    const sql = `
      SELECT 
        channel,
        COUNT(*) as total_campaigns,
        SUM(campaign_size) as total_outreach,
        SUM(leads) as total_leads,
        SUM(contracts_sent) as total_contracts_sent,
        SUM(contracts_closed) as total_contracts_closed,
        SUM(cost) as total_cost,
        ROUND(AVG(NULLIF(response_rate, 0)), 4) as avg_response_rate,
        ROUND(AVG(NULLIF(cost_per_lead, 0)), 2) as avg_cost_per_lead,
        CASE 
          WHEN SUM(leads) > 0 
          THEN ROUND(SUM(contracts_sent)::numeric / SUM(leads) * 100, 2)
          ELSE 0
        END as lead_to_contract_rate,
        CASE 
          WHEN SUM(contracts_sent) > 0 
          THEN ROUND(SUM(contracts_closed)::numeric / SUM(contracts_sent) * 100, 2)
          ELSE 0
        END as close_rate
      FROM v_channel_pipeline
      ${whereClause}
      GROUP BY channel
      ORDER BY total_leads DESC
    `;

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
