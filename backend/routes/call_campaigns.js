/**
 * Rotas CRUD para tabela CALL_CAMPAIGNS (Campanhas Cold Calling)
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { query } = require('../config/db');

// ============================================
// VALIDAÇÕES
// ============================================

const callCampaignValidation = [
  body('date_created').optional().isISO8601().toDate().withMessage('Data de criação inválida'),
  body('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Ano inválido'),
  body('campaign_size').optional().isInt({ min: 0 }).withMessage('Tamanho da campanha deve ser positivo'),
  body('leads_generated').optional().isInt({ min: 0 }).withMessage('Leads gerados deve ser positivo'),
  body('campaign_cost').optional().isDecimal().withMessage('Custo da campanha deve ser um número'),
];

const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID deve ser um número inteiro positivo'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: 'Erro de validação',
      details: errors.array(),
    });
  }
  next();
};

// ============================================
// ROTAS
// ============================================

/**
 * GET /api/call-campaigns
 * Lista todas as campanhas de cold calling com filtros
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      sortBy = 'id',
      sortOrder = 'DESC',
      // Filtros específicos
      county,
      state,
      entity,
      year,
      month,
      is_campaign_complete,
      date_start,
      date_end,
      min_leads,
      min_contracts_closed,
    } = req.query;

    let sql = 'SELECT * FROM call_campaigns WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (county) {
      paramCount++;
      sql += ` AND county ILIKE $${paramCount}`;
      params.push(`%${county}%`);
    }

    if (state) {
      paramCount++;
      sql += ` AND state = $${paramCount}`;
      params.push(state);
    }

    if (entity) {
      paramCount++;
      sql += ` AND entity ILIKE $${paramCount}`;
      params.push(`%${entity}%`);
    }

    if (year) {
      paramCount++;
      sql += ` AND year = $${paramCount}`;
      params.push(year);
    }

    if (month) {
      paramCount++;
      sql += ` AND month = $${paramCount}`;
      params.push(month);
    }

    if (is_campaign_complete !== undefined) {
      paramCount++;
      sql += ` AND is_campaign_complete = $${paramCount}`;
      params.push(is_campaign_complete === 'true');
    }

    if (date_start) {
      paramCount++;
      sql += ` AND date_created >= $${paramCount}`;
      params.push(date_start);
    }

    if (date_end) {
      paramCount++;
      sql += ` AND date_created <= $${paramCount}`;
      params.push(date_end);
    }

    if (min_leads) {
      paramCount++;
      sql += ` AND leads_generated >= $${paramCount}`;
      params.push(min_leads);
    }

    if (min_contracts_closed) {
      paramCount++;
      sql += ` AND num_contracts_closed >= $${paramCount}`;
      params.push(min_contracts_closed);
    }

    // Contagem total
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await query(countSql, params);
    const totalCount = parseInt(countResult.rows[0].count);

    // Ordenação segura
    const allowedSortColumns = [
      'id', 'date_created', 'county', 'state', 'entity', 'year', 'month',
      'campaign_size', 'leads_generated', 'num_contracts_closed', 'response_rate',
      'campaign_cost', 'margin_earned', 'created_at'
    ];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'id';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    sql += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/call-campaigns/:id
 * Busca uma campanha de cold calling específica por ID
 */
router.get('/:id', idValidation, validate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM call_campaigns WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Campanha de cold calling não encontrada',
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
 * POST /api/call-campaigns
 * Cria uma nova campanha de cold calling
 */
router.post('/', callCampaignValidation, validate, async (req, res, next) => {
  try {
    const {
      date_created, month, year, county, state, entity,
      is_campaign_complete, campaign_size, leads_generated,
      num_contracts_sent, num_contracts_closed, num_contracts_cancelled,
      response_rate, lead_to_contract_sent_rate, contract_sent_to_contract_closed_rate,
      total_closing_proceeds, average_margin_per_contract, campaign_cost,
      average_cost_per_lead, average_cost_per_contract, margin_earned,
      average_margin_per_contract_2,
    } = req.body;

    const sql = `
      INSERT INTO call_campaigns (
        date_created, month, year, county, state, entity,
        is_campaign_complete, campaign_size, leads_generated,
        num_contracts_sent, num_contracts_closed, num_contracts_cancelled,
        response_rate, lead_to_contract_sent_rate, contract_sent_to_contract_closed_rate,
        total_closing_proceeds, average_margin_per_contract, campaign_cost,
        average_cost_per_lead, average_cost_per_contract, margin_earned,
        average_margin_per_contract_2
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING *
    `;

    const params = [
      date_created, month, year, county, state, entity,
      is_campaign_complete, campaign_size, leads_generated,
      num_contracts_sent, num_contracts_closed, num_contracts_cancelled,
      response_rate, lead_to_contract_sent_rate, contract_sent_to_contract_closed_rate,
      total_closing_proceeds, average_margin_per_contract, campaign_cost,
      average_cost_per_lead, average_cost_per_contract, margin_earned,
      average_margin_per_contract_2,
    ];

    const result = await query(sql, params);

    res.status(201).json({
      success: true,
      message: 'Campanha de cold calling criada com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/call-campaigns/:id
 * Atualiza uma campanha de cold calling existente
 */
router.put('/:id', [...idValidation, ...callCampaignValidation], validate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingCampaign = await query('SELECT id FROM call_campaigns WHERE id = $1', [id]);
    if (existingCampaign.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Campanha de cold calling não encontrada',
      });
    }

    const allowedFields = [
      'date_created', 'month', 'year', 'county', 'state', 'entity',
      'is_campaign_complete', 'campaign_size', 'leads_generated',
      'num_contracts_sent', 'num_contracts_closed', 'num_contracts_cancelled',
      'response_rate', 'lead_to_contract_sent_rate', 'contract_sent_to_contract_closed_rate',
      'total_closing_proceeds', 'average_margin_per_contract', 'campaign_cost',
      'average_cost_per_lead', 'average_cost_per_contract', 'margin_earned',
      'average_margin_per_contract_2',
    ];

    const updates = [];
    const params = [];
    let paramCount = 0;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        paramCount++;
        updates.push(`${field} = $${paramCount}`);
        params.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Nenhum campo para atualizar',
      });
    }

    paramCount++;
    updates.push(`updated_at = $${paramCount}`);
    params.push(new Date());

    paramCount++;
    params.push(id);

    const sql = `UPDATE call_campaigns SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await query(sql, params);

    res.json({
      success: true,
      message: 'Campanha de cold calling atualizada com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/call-campaigns/:id
 * Remove uma campanha de cold calling
 */
router.delete('/:id', idValidation, validate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingCampaign = await query('SELECT id FROM call_campaigns WHERE id = $1', [id]);
    if (existingCampaign.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Campanha de cold calling não encontrada',
      });
    }

    await query('DELETE FROM call_campaigns WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Campanha de cold calling removida com sucesso',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/call-campaigns/analytics/kpis
 * Returns aggregated KPIs for call campaigns
 * Can filter by entity, year, state, etc.
 */
router.get('/analytics/kpis', async (req, res, next) => {
  try {
    const { year, state, county } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (year) {
      paramCount++;
      whereClause += ` AND year = $${paramCount}`;
      params.push(parseInt(year));
    }

    if (state) {
      paramCount++;
      whereClause += ` AND state = $${paramCount}`;
      params.push(state);
    }

    if (county) {
      paramCount++;
      whereClause += ` AND county ILIKE $${paramCount}`;
      params.push(`%${county}%`);
    }

    // Overall KPIs - SUMs for totals, AVG for per-row calculated metrics (matching CSV AVERAGEIF)
    const overallQuery = `
      SELECT 
        COALESCE(SUM(campaign_size), 0) as total_calls_made,
        COALESCE(SUM(leads_generated), 0) as total_leads_generated,
        COALESCE(SUM(num_contracts_sent), 0) as total_contracts_sent,
        COALESCE(SUM(num_contracts_closed), 0) as total_contracts_closed,
        COALESCE(SUM(num_contracts_cancelled), 0) as total_contracts_cancelled,
        COALESCE(SUM(total_closing_proceeds), 0) as total_closing_proceeds,
        COALESCE(SUM(campaign_cost), 0) as total_spent,
        COALESCE(SUM(margin_earned), 0) as total_margin,
        COUNT(*) as total_campaigns,
        COALESCE(AVG(average_cost_per_lead), 0) as avg_cost_per_lead,
        COALESCE(AVG(average_cost_per_contract), 0) as avg_cost_per_contract,
        COALESCE(AVG(average_margin_per_contract), 0) as avg_margin_per_contract
      FROM call_campaigns
      ${whereClause}
    `;

    // KPIs by Entity
    const byEntityQuery = `
      SELECT 
        entity,
        COALESCE(SUM(campaign_size), 0) as total_calls_made,
        COALESCE(SUM(leads_generated), 0) as total_leads_generated,
        COALESCE(SUM(num_contracts_sent), 0) as total_contracts_sent,
        COALESCE(SUM(num_contracts_closed), 0) as total_contracts_closed,
        COALESCE(SUM(num_contracts_cancelled), 0) as total_contracts_cancelled,
        COALESCE(SUM(total_closing_proceeds), 0) as total_closing_proceeds,
        COALESCE(SUM(campaign_cost), 0) as total_spent,
        COALESCE(SUM(margin_earned), 0) as total_margin,
        COUNT(*) as total_campaigns,
        COALESCE(AVG(average_cost_per_lead), 0) as avg_cost_per_lead,
        COALESCE(AVG(average_cost_per_contract), 0) as avg_cost_per_contract,
        COALESCE(AVG(average_margin_per_contract), 0) as avg_margin_per_contract
      FROM call_campaigns
      ${whereClause}
      GROUP BY entity
      ORDER BY entity
    `;

    // KPIs by Year
    const byYearQuery = `
      SELECT 
        year,
        COALESCE(SUM(campaign_size), 0) as total_calls_made,
        COALESCE(SUM(leads_generated), 0) as total_leads_generated,
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
      ${whereClause}
      GROUP BY year
      ORDER BY year DESC
    `;

    // KPIs by State
    const byStateQuery = `
      SELECT 
        state,
        COALESCE(SUM(campaign_size), 0) as total_calls_made,
        COALESCE(SUM(leads_generated), 0) as total_leads_generated,
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
      ${whereClause}
      GROUP BY state
      ORDER BY SUM(campaign_size) DESC
      LIMIT 15
    `;

    const [overallResult, byEntityResult, byYearResult, byStateResult] = await Promise.all([
      query(overallQuery, params),
      query(byEntityQuery, params),
      query(byYearQuery, params),
      query(byStateQuery, params),
    ]);

    // Calculate derived metrics for overall
    const overall = overallResult.rows[0];
    const overallKpis = calculateCallDerivedKpis(overall);

    // Calculate derived metrics for each entity
    const byEntity = byEntityResult.rows.map(row => ({
      entity: row.entity || 'Unknown',
      ...calculateCallDerivedKpis(row),
    }));

    // Calculate derived metrics for each year
    const byYear = byYearResult.rows.map(row => ({
      year: row.year,
      ...calculateCallDerivedKpis(row),
    }));

    // Calculate derived metrics for each state
    const byState = byStateResult.rows.map(row => ({
      state: row.state || 'Unknown',
      ...calculateCallDerivedKpis(row),
    }));

    res.json({
      success: true,
      data: {
        overall: overallKpis,
        byEntity,
        byYear,
        byState,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to calculate derived KPIs (matching spreadsheet formulas)
// Uses AVG of per-row values for cost/margin metrics (matching CSV AVERAGEIF)
function calculateCallDerivedKpis(row) {
  const totalCallsMade = parseFloat(row.total_calls_made) || 0;
  const totalLeads = parseFloat(row.total_leads_generated) || 0;
  const totalContractsSent = parseFloat(row.total_contracts_sent) || 0;
  const totalContractsClosed = parseFloat(row.total_contracts_closed) || 0;
  const totalClosingProceeds = parseFloat(row.total_closing_proceeds) || 0;
  const totalSpent = parseFloat(row.total_spent) || 0;
  const totalMargin = parseFloat(row.total_margin) || 0;
  const totalCampaigns = parseInt(row.total_campaigns) || 0;
  
  // AVG of per-row values (matching CSV AVERAGEIF formula)
  const avgCostPerLead = parseFloat(row.avg_cost_per_lead) || 0;
  const avgCostPerContract = parseFloat(row.avg_cost_per_contract) || 0;
  const avgMarginPerContract = parseFloat(row.avg_margin_per_contract) || 0;

  return {
    totalCallsMade,
    totalLeads,
    totalContractsSent,
    totalContractsClosed,
    totalContractsCancelled: parseFloat(row.total_contracts_cancelled) || 0,
    totalClosingProceeds,
    totalSpent,
    totalMargin,
    totalCampaigns,
    // Rates calculated from TOTALS (matching spreadsheet Total/Total formulas)
    // Response Rate = Total Leads / Total Calls
    responseRate: totalCallsMade > 0 ? (totalLeads / totalCallsMade) * 100 : 0,
    // Lead to Contract Sent Rate = Total Contracts Sent / Total Leads
    leadToContractSentRate: totalLeads > 0 ? (totalContractsSent / totalLeads) * 100 : 0,
    // Contract Sent to Contract Closed Rate = Total Contracts Closed / Total Contracts Sent
    contractSentToClosedRate: totalContractsSent > 0 ? (totalContractsClosed / totalContractsSent) * 100 : 0,
    // Average Closing Proceeds Per Contract = Total Closing Proceeds / Total Contracts Closed
    avgClosingProceedsPerContract: totalContractsClosed > 0 ? totalClosingProceeds / totalContractsClosed : 0,
    // Cost/Margin metrics use AVG of per-row values (matching CSV AVERAGEIF)
    avgCostPerLead,
    avgCostPerContract,
    avgMarginPerContract,
    // ROAS = Total $ Margin / Total $ Spent (as percentage)
    roas: totalSpent > 0 ? (totalMargin / totalSpent) * 100 : 0,
  };
}

/**
 * GET /api/call-campaigns/filters/options
 * Retorna opções únicas para filtros
 */
router.get('/filters/options', async (req, res, next) => {
  try {
    const [states, entities, years, months] = await Promise.all([
      query('SELECT DISTINCT state FROM call_campaigns WHERE state IS NOT NULL ORDER BY state'),
      query('SELECT DISTINCT entity FROM call_campaigns WHERE entity IS NOT NULL ORDER BY entity'),
      query('SELECT DISTINCT year FROM call_campaigns WHERE year IS NOT NULL ORDER BY year DESC'),
      query('SELECT DISTINCT month FROM call_campaigns WHERE month IS NOT NULL ORDER BY month'),
    ]);

    res.json({
      success: true,
      data: {
        states: states.rows.map(r => r.state),
        entities: entities.rows.map(r => r.entity),
        years: years.rows.map(r => r.year),
        months: months.rows.map(r => r.month),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
