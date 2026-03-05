/**
 * Rotas CRUD para tabela EXPENSES (Despesas)
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { query } = require('../config/db');

// ============================================
// VALIDAÇÕES
// ============================================

const expenseValidation = [
  body('date').optional().isISO8601().toDate().withMessage('Data inválida'),
  body('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Ano inválido'),
  body('amount').optional().isDecimal().withMessage('Valor deve ser um número'),
  body('balance').optional().isDecimal().withMessage('Saldo deve ser um número'),
  body('alexa_share').optional().isDecimal().withMessage('Alexa share deve ser um número'),
  body('imelda_share').optional().isDecimal().withMessage('Imelda share deve ser um número'),
  body('rhea_share').optional().isDecimal().withMessage('Rhea share deve ser um número'),
  body('vendor_customer').optional().isLength({ max: 200 }).withMessage('Vendor/Customer deve ter no máximo 200 caracteres'),
  body('account_name').optional().isLength({ max: 100 }).withMessage('Account name deve ter no máximo 100 caracteres'),
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
 * GET /api/expenses
 * Lista todas as despesas com filtros
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      sortBy = 'id',
      sortOrder = 'DESC',
      // Filtros específicos
      vendor_customer,
      account_name,
      account_type,
      entity,
      year,
      month,
      payer_recipient,
      reconciliation_status,
      income_expense_sharing,
      date_start,
      date_end,
      min_amount,
      max_amount,
      search, // busca geral em description
    } = req.query;

    let sql = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (vendor_customer) {
      paramCount++;
      sql += ` AND vendor_customer ILIKE $${paramCount}`;
      params.push(`%${vendor_customer}%`);
    }

    if (account_name) {
      paramCount++;
      sql += ` AND account_name ILIKE $${paramCount}`;
      params.push(`%${account_name}%`);
    }

    if (account_type) {
      paramCount++;
      sql += ` AND account_type = $${paramCount}`;
      params.push(account_type);
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

    if (payer_recipient) {
      paramCount++;
      sql += ` AND payer_recipient ILIKE $${paramCount}`;
      params.push(`%${payer_recipient}%`);
    }

    if (reconciliation_status) {
      paramCount++;
      sql += ` AND reconciliation_status = $${paramCount}`;
      params.push(reconciliation_status);
    }

    if (income_expense_sharing) {
      paramCount++;
      sql += ` AND income_expense_sharing = $${paramCount}`;
      params.push(income_expense_sharing);
    }

    if (date_start) {
      paramCount++;
      sql += ` AND date >= $${paramCount}`;
      params.push(date_start);
    }

    if (date_end) {
      paramCount++;
      sql += ` AND date <= $${paramCount}`;
      params.push(date_end);
    }

    if (min_amount) {
      paramCount++;
      sql += ` AND amount >= $${paramCount}`;
      params.push(min_amount);
    }

    if (max_amount) {
      paramCount++;
      sql += ` AND amount <= $${paramCount}`;
      params.push(max_amount);
    }

    if (search) {
      paramCount++;
      sql += ` AND (description ILIKE $${paramCount} OR memo ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Contagem total
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await query(countSql, params);
    const totalCount = parseInt(countResult.rows[0].count);

    // Ordenação segura
    const allowedSortColumns = [
      'id', 'date', 'vendor_customer', 'account_name', 'account_type', 'entity',
      'year', 'month', 'amount', 'balance', 'reconciliation_status',
      'alexa_share', 'imelda_share', 'rhea_share', 'created_at'
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
 * GET /api/expenses/:id
 * Busca uma despesa específica por ID
 */
router.get('/:id', idValidation, validate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM expenses WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Despesa não encontrada',
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
 * POST /api/expenses
 * Cria uma nova despesa
 */
router.post('/', expenseValidation, validate, async (req, res, next) => {
  try {
    const {
      date, month, year, description, vendor_customer, account_name,
      account_type, payer_recipient, amount, balance, reconciliation_status,
      income_expense_sharing, entity, alexa_share, imelda_share, rhea_share, memo,
    } = req.body;

    const sql = `
      INSERT INTO expenses (
        date, month, year, description, vendor_customer, account_name,
        account_type, payer_recipient, amount, balance, reconciliation_status,
        income_expense_sharing, entity, alexa_share, imelda_share, rhea_share, memo
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) RETURNING *
    `;

    const params = [
      date, month, year, description, vendor_customer, account_name,
      account_type, payer_recipient, amount, balance, reconciliation_status,
      income_expense_sharing, entity, alexa_share, imelda_share, rhea_share, memo,
    ];

    const result = await query(sql, params);

    res.status(201).json({
      success: true,
      message: 'Despesa criada com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/expenses/:id
 * Atualiza uma despesa existente
 */
router.put('/:id', [...idValidation, ...expenseValidation], validate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingExpense = await query('SELECT id FROM expenses WHERE id = $1', [id]);
    if (existingExpense.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Despesa não encontrada',
      });
    }

    const allowedFields = [
      'date', 'month', 'year', 'description', 'vendor_customer', 'account_name',
      'account_type', 'payer_recipient', 'amount', 'balance', 'reconciliation_status',
      'income_expense_sharing', 'entity', 'alexa_share', 'imelda_share', 'rhea_share', 'memo',
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

    const sql = `UPDATE expenses SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await query(sql, params);

    res.json({
      success: true,
      message: 'Despesa atualizada com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/expenses/:id
 * Remove uma despesa
 */
router.delete('/:id', idValidation, validate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingExpense = await query('SELECT id FROM expenses WHERE id = $1', [id]);
    if (existingExpense.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Despesa não encontrada',
      });
    }

    await query('DELETE FROM expenses WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Despesa removida com sucesso',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/expenses/filters/options
 * Retorna opções únicas para filtros
 */
router.get('/filters/options', async (req, res, next) => {
  try {
    const [accountTypes, accountNames, entities, years, months, reconciliationStatuses, sharingOptions] = await Promise.all([
      query('SELECT DISTINCT account_type FROM expenses WHERE account_type IS NOT NULL ORDER BY account_type'),
      query('SELECT DISTINCT account_name FROM expenses WHERE account_name IS NOT NULL ORDER BY account_name'),
      query('SELECT DISTINCT entity FROM expenses WHERE entity IS NOT NULL ORDER BY entity'),
      query('SELECT DISTINCT year FROM expenses WHERE year IS NOT NULL ORDER BY year DESC'),
      query('SELECT DISTINCT month FROM expenses WHERE month IS NOT NULL ORDER BY month'),
      query('SELECT DISTINCT reconciliation_status FROM expenses WHERE reconciliation_status IS NOT NULL ORDER BY reconciliation_status'),
      query('SELECT DISTINCT income_expense_sharing FROM expenses WHERE income_expense_sharing IS NOT NULL ORDER BY income_expense_sharing'),
    ]);

    res.json({
      success: true,
      data: {
        accountTypes: accountTypes.rows.map(r => r.account_type),
        accountNames: accountNames.rows.map(r => r.account_name),
        entities: entities.rows.map(r => r.entity),
        years: years.rows.map(r => r.year),
        months: months.rows.map(r => r.month),
        reconciliationStatuses: reconciliationStatuses.rows.map(r => r.reconciliation_status),
        sharingOptions: sharingOptions.rows.map(r => r.income_expense_sharing),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/expenses/stats/summary
 * Retorna estatísticas resumidas das despesas
 */
router.get('/stats/summary', async (req, res, next) => {
  try {
    const { year, month } = req.query;
    
    let sql = `
      SELECT 
        COUNT(*) as total_records,
        SUM(amount) as total_amount,
        SUM(alexa_share) as total_alexa_share,
        SUM(imelda_share) as total_imelda_share,
        SUM(rhea_share) as total_rhea_share,
        AVG(amount) as avg_amount
      FROM expenses
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

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

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
