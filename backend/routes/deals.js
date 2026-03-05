/**
 * Rotas CRUD para tabela DEALS (Negócios/Propriedades)
 */

const express = require('express');
const router = express.Router();
const { body, param, query: queryValidator, validationResult } = require('express-validator');
const { query } = require('../config/db');

// ============================================
// VALIDAÇÕES
// ============================================

const dealValidation = [
  body('purchase_price').optional().isDecimal().withMessage('Preço de compra deve ser um número'),
  body('sale_price').optional().isDecimal().withMessage('Preço de venda deve ser um número'),
  body('acres').optional().isDecimal().withMessage('Acres deve ser um número'),
  body('purchase_date').optional().isISO8601().toDate().withMessage('Data de compra inválida'),
  body('sale_date').optional().isISO8601().toDate().withMessage('Data de venda inválida'),
  body('status').optional().isLength({ max: 50 }).withMessage('Status deve ter no máximo 50 caracteres'),
];

const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID deve ser um número inteiro positivo'),
];

// Middleware para verificar erros de validação
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
 * GET /api/deals
 * Lista todos os deals com filtros, paginação e ordenação
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      // Paginação
      page = 1,
      limit = 50,
      // Ordenação
      sortBy = 'id',
      sortOrder = 'DESC',
      // Filtros
      status,
      entity,
      partners,
      purchase_date_start,
      purchase_date_end,
      sale_date_start,
      sale_date_end,
      min_profit,
      max_profit,
      min_acres,
      max_acres,
      search, // busca geral em property_description
    } = req.query;

    // Construir query dinâmica
    let sql = 'SELECT * FROM deals WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Aplicar filtros
    if (status) {
      paramCount++;
      sql += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (entity) {
      paramCount++;
      sql += ` AND entity ILIKE $${paramCount}`;
      params.push(`%${entity}%`);
    }

    if (partners) {
      paramCount++;
      sql += ` AND partners ILIKE $${paramCount}`;
      params.push(`%${partners}%`);
    }

    if (purchase_date_start) {
      paramCount++;
      sql += ` AND purchase_date >= $${paramCount}`;
      params.push(purchase_date_start);
    }

    if (purchase_date_end) {
      paramCount++;
      sql += ` AND purchase_date <= $${paramCount}`;
      params.push(purchase_date_end);
    }

    if (sale_date_start) {
      paramCount++;
      sql += ` AND sale_date >= $${paramCount}`;
      params.push(sale_date_start);
    }

    if (sale_date_end) {
      paramCount++;
      sql += ` AND sale_date <= $${paramCount}`;
      params.push(sale_date_end);
    }

    if (min_profit) {
      paramCount++;
      sql += ` AND profit >= $${paramCount}`;
      params.push(min_profit);
    }

    if (max_profit) {
      paramCount++;
      sql += ` AND profit <= $${paramCount}`;
      params.push(max_profit);
    }

    if (min_acres) {
      paramCount++;
      sql += ` AND acres >= $${paramCount}`;
      params.push(min_acres);
    }

    if (max_acres) {
      paramCount++;
      sql += ` AND acres <= $${paramCount}`;
      params.push(max_acres);
    }

    if (search) {
      paramCount++;
      sql += ` AND (property_description ILIKE $${paramCount} OR property_apn ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Query para contar total de registros (para paginação)
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await query(countSql, params);
    const totalCount = parseInt(countResult.rows[0].count);

    // Validar coluna de ordenação (prevenir SQL injection)
    const allowedSortColumns = [
      'id', 'property_description', 'status', 'entity', 'purchase_date', 'sale_date',
      'purchase_price', 'sale_price', 'profit', 'roi', 'gross_margin', 'acres', 'days_in_inventory',
      'created_at', 'updated_at'
    ];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'id';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Adicionar ordenação e paginação
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
 * GET /api/deals/:id
 * Busca um deal específico por ID
 */
router.get('/:id', idValidation, validate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM deals WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Deal não encontrado',
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
 * POST /api/deals
 * Cria um novo deal
 */
router.post('/', dealValidation, validate, async (req, res, next) => {
  try {
    const {
      property_description,
      property_apn,
      acres,
      campaign_type,
      entity,
      partners,
      status,
      purchase_date,
      purchase_price,
      funding_costs,
      sale_date,
      sale_year,
      sale_price,
      estimated_payback_date,
      closing_costs,
      funding_payout,
      total_costs,
      revenue,
      profit,
      gross_profit,
      days_in_inventory,
      roi,
      gross_margin,
    } = req.body;

    const sql = `
      INSERT INTO deals (
        property_description, property_apn, acres, campaign_type, entity, partners,
        status, purchase_date, purchase_price, funding_costs, sale_date, sale_year,
        sale_price, estimated_payback_date, closing_costs, funding_payout, total_costs,
        revenue, profit, gross_profit, days_in_inventory, roi, gross_margin
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      ) RETURNING *
    `;

    const params = [
      property_description, property_apn, acres, campaign_type, entity, partners,
      status, purchase_date, purchase_price, funding_costs, sale_date, sale_year,
      sale_price, estimated_payback_date, closing_costs, funding_payout, total_costs,
      revenue, profit, gross_profit, days_in_inventory, roi, gross_margin,
    ];

    const result = await query(sql, params);

    res.status(201).json({
      success: true,
      message: 'Deal criado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/deals/:id
 * Atualiza um deal existente
 */
router.put('/:id', [...idValidation, ...dealValidation], validate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar se o deal existe
    const existingDeal = await query('SELECT id FROM deals WHERE id = $1', [id]);
    if (existingDeal.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Deal não encontrado',
      });
    }

    // Construir query de update dinâmico
    const allowedFields = [
      'property_description', 'property_apn', 'acres', 'campaign_type', 'entity', 'partners',
      'status', 'purchase_date', 'purchase_price', 'funding_costs', 'sale_date', 'sale_year',
      'sale_price', 'estimated_payback_date', 'closing_costs', 'funding_payout', 'total_costs',
      'revenue', 'profit', 'gross_profit', 'days_in_inventory', 'roi', 'gross_margin',
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

    // Adicionar updated_at
    paramCount++;
    updates.push(`updated_at = $${paramCount}`);
    params.push(new Date());

    // Adicionar id ao final
    paramCount++;
    params.push(id);

    const sql = `UPDATE deals SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await query(sql, params);

    res.json({
      success: true,
      message: 'Deal atualizado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/deals/:id
 * Remove um deal
 */
router.delete('/:id', idValidation, validate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar se o deal existe
    const existingDeal = await query('SELECT id FROM deals WHERE id = $1', [id]);
    if (existingDeal.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Deal não encontrado',
      });
    }

    await query('DELETE FROM deals WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Deal removido com sucesso',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/deals/stats/summary
 * Retorna estatísticas resumidas dos deals
 */
router.get('/stats/summary', async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_deals,
        SUM(profit) as total_profit,
        AVG(profit) as avg_profit,
        AVG(roi) as avg_roi,
        AVG(days_in_inventory) as avg_days_inventory,
        SUM(CASE WHEN status = 'Sold' THEN 1 ELSE 0 END) as sold_count,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_count
      FROM deals
    `;
    const result = await query(sql);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
