/**
 * Rotas para DataKPI (Agent Performance Metrics)
 * Lê da tabela DataAirtable.DataKPI através das views
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// ============================================
// ROTAS
// ============================================

/**
 * GET /api/datakpi/daily
 * Retorna atividade diária dos agentes
 * Query params: ?agent=nome, ?from=YYYY-MM-DD, ?to=YYYY-MM-DD
 */
router.get('/daily', async (req, res, next) => {
  try {
    const { agent, from, to, limit = 100 } = req.query;

    let sql = 'SELECT * FROM v_agent_daily WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (agent) {
      paramCount++;
      sql += ` AND agent_name ILIKE $${paramCount}`;
      params.push(`%${agent}%`);
    }

    if (from) {
      paramCount++;
      sql += ` AND activity_date >= $${paramCount}`;
      params.push(from);
    }

    if (to) {
      paramCount++;
      sql += ` AND activity_date <= $${paramCount}`;
      params.push(to);
    }

    sql += ' ORDER BY activity_date DESC';
    
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
 * GET /api/datakpi/weekly
 * Retorna KPIs agregados por agente e semana
 * Query params: ?agent=nome, ?year=2025, ?week=2025-01-06
 */
router.get('/weekly', async (req, res, next) => {
  try {
    const { agent, year, week, limit = 100 } = req.query;

    let sql = 'SELECT * FROM v_agent_weekly WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (agent) {
      paramCount++;
      sql += ` AND agent_name ILIKE $${paramCount}`;
      params.push(`%${agent}%`);
    }

    if (year) {
      paramCount++;
      sql += ` AND year = $${paramCount}`;
      params.push(parseInt(year));
    }

    if (week) {
      // week can be in format 'YYYY-MM-DD' (week start date)
      paramCount++;
      sql += ` AND week_start = $${paramCount}`;
      params.push(week);
    }

    sql += ' ORDER BY week_start DESC, agent_name';
    
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
 * GET /api/datakpi/monthly
 * Retorna KPIs agregados por agente e mês
 * Query params: ?agent=nome, ?year=2025, ?month=2025-01-01
 */
router.get('/monthly', async (req, res, next) => {
  try {
    const { agent, year, month, limit = 100 } = req.query;

    let sql = 'SELECT * FROM v_agent_monthly WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (agent) {
      paramCount++;
      sql += ` AND agent_name ILIKE $${paramCount}`;
      params.push(`%${agent}%`);
    }

    if (year) {
      paramCount++;
      sql += ` AND year = $${paramCount}`;
      params.push(parseInt(year));
    }

    if (month) {
      // month can be in format 'YYYY-MM-01' or just the date
      paramCount++;
      sql += ` AND month = $${paramCount}`;
      params.push(month);
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
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/datakpi/agents
 * Retorna lista de agentes com totais all-time
 */
router.get('/agents', async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        agent_name,
        SUM(total_signed_contracts) as total_signed_contracts,
        SUM(total_offers_sent) as total_offers_sent,
        SUM(total_hot_leads) as total_hot_leads,
        SUM(total_cold_calls) as total_cold_calls,
        SUM(total_sms_sent) as total_sms_sent,
        ROUND(AVG(NULLIF(avg_close_rate, 0)), 4) as avg_close_rate
      FROM v_agent_monthly
      GROUP BY agent_name
      ORDER BY SUM(total_signed_contracts) DESC
    `;

    const result = await query(sql);

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
 * GET /api/datakpi/:id
 * Retorna um registro específico da tabela DataKPI pelo ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT * FROM "DataAirtable"."DataKPI"
      WHERE "ID" = $1
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Registro não encontrado',
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

module.exports = router;
