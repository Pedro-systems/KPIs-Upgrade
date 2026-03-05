/**
 * Servidor Express Principal
 * API REST para gerenciamento de KPIs - PostgreSQL
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Importar configuração do banco
const { testConnection } = require('./config/db');

// Importar rotas
const dealsRoutes = require('./routes/deals');
const campaignsRoutes = require('./routes/campaigns');
const callCampaignsRoutes = require('./routes/call_campaigns');
const mailCampaignsRoutes = require('./routes/mail_campaigns');
const expensesRoutes = require('./routes/expenses');
const summaryRoutes = require('./routes/summary');
const datakpiRoutes = require('./routes/datakpi');
const crossviewRoutes = require('./routes/crossview');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARES
// ============================================

// Segurança com Helmet
app.use(helmet());

// CORS - Configuração para permitir requisições do frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// ============================================
// ROTAS
// ============================================

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API funcionando corretamente',
    timestamp: new Date().toISOString(),
  });
});

// Rotas das tabelas
app.use('/api/deals', dealsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/call-campaigns', callCampaignsRoutes);
app.use('/api/mail-campaigns', mailCampaignsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/datakpi', datakpiRoutes);
app.use('/api/crossview', crossviewRoutes);

// ============================================
// TRATAMENTO DE ERROS
// ============================================

// Rota não encontrada
app.use((req, res, next) => {
  res.status(404).json({
    error: true,
    message: `Rota não encontrada: ${req.method} ${req.url}`,
  });
});

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('Erro:', err);

  // Erro de validação do express-validator
  if (err.array) {
    return res.status(400).json({
      error: true,
      message: 'Erro de validação',
      details: err.array(),
    });
  }

  // Erro do PostgreSQL
  if (err.code) {
    const pgErrors = {
      '23505': { status: 409, message: 'Registro duplicado' },
      '23503': { status: 400, message: 'Violação de chave estrangeira' },
      '23502': { status: 400, message: 'Campo obrigatório não preenchido' },
      '22P02': { status: 400, message: 'Formato de dado inválido' },
    };

    const pgError = pgErrors[err.code] || { status: 500, message: 'Erro no banco de dados' };
    return res.status(pgError.status).json({
      error: true,
      message: pgError.message,
      code: err.code,
    });
  }

  // Erro genérico
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

const startServer = async () => {
  // Testar conexão com o banco antes de iniciar
  const dbConnected = await testConnection();

  if (!dbConnected) {
    console.error('❌ Não foi possível conectar ao banco de dados. Verifique as configurações.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════╗
    ║                                                   ║
    ║   🚀 Servidor rodando na porta ${PORT}              ║
    ║   📊 API URL: http://localhost:${PORT}/api          ║
    ║   🔧 Ambiente: ${process.env.NODE_ENV || 'development'}                    ║
    ║                                                   ║
    ╚═══════════════════════════════════════════════════╝
    `);
  });
};

startServer();

module.exports = app;
