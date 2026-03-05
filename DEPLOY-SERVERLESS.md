# 🔄 Alternativa: Backend Serverless na Vercel

Se você quiser hospedar o backend também na Vercel (serverless), siga este guia.

## ⚠️ Limitações Importantes

1. **SSH Tunnel NÃO funciona** - você PRECISA de conexão direta ao PostgreSQL
2. **Sem estado persistente** - cada requisição é uma nova instância
3. **Cold start** - primeiras requisições podem ser lentas
4. **Timeout de 10s** (Hobby) ou 60s (Pro)

## 📁 Estrutura Necessária

Transforme o backend Express em Serverless Functions:

```
UpgradeKPIs/
├── api/                    # Cada arquivo = 1 endpoint
│   ├── health.js
│   ├── deals.js
│   ├── campaigns.js
│   ├── datakpi.js
│   └── crossview.js
├── config/
│   └── db-serverless.js   # Pool otimizado para serverless
├── vercel-backend.json    # Config do backend
└── package.json
```

## 🛠️ Passo 1: Criar DB Config Serverless

Crie `config/db-serverless.js`:

```javascript
const { Pool } = require('pg');

// Pool compartilhado entre invocações
let pool;

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 1, // Máximo 1 conexão por função
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
};

module.exports = {
  query: async (text, params) => {
    const pool = getPool();
    return pool.query(text, params);
  },
};
```

## 🛠️ Passo 2: Converter Rotas para Functions

Exemplo: `api/deals.js`

```javascript
const { query } = require('../config/db-serverless');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET /api/deals
    if (req.method === 'GET') {
      const result = await query(`
        SELECT * FROM deals
        ORDER BY created_at DESC
        LIMIT 100
      `);
      return res.status(200).json({ data: result.rows });
    }

    // POST /api/deals
    if (req.method === 'POST') {
      const { name, amount, stage } = req.body;
      const result = await query(
        `INSERT INTO deals (name, amount, stage) 
         VALUES ($1, $2, $3) RETURNING *`,
        [name, amount, stage]
      );
      return res.status(201).json({ data: result.rows[0] });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
```

## 🛠️ Passo 3: Criar vercel-backend.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## 🛠️ Passo 4: Atualizar package.json

```json
{
  "name": "rhea-kpis-backend-serverless",
  "version": "1.0.0",
  "main": "api/index.js",
  "scripts": {
    "start": "node server.js",
    "dev": "vercel dev"
  },
  "dependencies": {
    "pg": "^8.11.3"
  }
}
```

## 🛠️ Passo 5: Endpoints a Converter

Você precisa criar um arquivo para cada rota principal:

### `api/health.js`
```javascript
module.exports = async (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
};
```

### `api/datakpi/daily.js`
```javascript
const { query } = require('../../config/db-serverless');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const result = await query(`
      SELECT * FROM "DataAirtable".v_agent_daily
      ORDER BY call_date DESC
      LIMIT 100
    `);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### `api/datakpi/weekly.js`
```javascript
const { query } = require('../../config/db-serverless');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const result = await query(`
      SELECT * FROM "DataAirtable".v_agent_weekly
      ORDER BY week_start DESC
    `);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

## 🛠️ Passo 6: Configurar Variáveis no Vercel

```bash
vercel env add DB_HOST production
vercel env add DB_PORT production
vercel env add DB_NAME production
vercel env add DB_USER production
vercel env add DB_PASSWORD production
```

## 🛠️ Passo 7: Deploy

```bash
cd backend
vercel --prod
```

## 🎯 Estrutura Final de URLs

```
https://seu-backend.vercel.app/api/health
https://seu-backend.vercel.app/api/deals
https://seu-backend.vercel.app/api/datakpi/daily
https://seu-backend.vercel.app/api/datakpi/weekly
https://seu-backend.vercel.app/api/crossview/overview
```

## ⚡ Otimizações para Serverless

### 1. Connection Pooling
Use **PgBouncer** ou **Neon Serverless Driver**:

```bash
npm install @neondatabase/serverless
```

```javascript
// config/db-serverless.js
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

module.exports = {
  query: async (text, params) => {
    return { rows: await sql(text, params) };
  },
};
```

### 2. Edge Functions (mais rápido)
Mude para Edge Runtime:

```javascript
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Código aqui
  return new Response(JSON.stringify({ ok: true }));
}
```

### 3. Cache de Queries
```javascript
const cache = new Map();

module.exports = async (req, res) => {
  const cacheKey = req.url;
  
  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }
  
  const result = await query('SELECT ...');
  cache.set(cacheKey, result.rows);
  
  setTimeout(() => cache.delete(cacheKey), 60000); // 1 minuto
  
  return res.json(result.rows);
};
```

## ⚠️ Desvantagens vs Railway/Render

| Aspecto | Vercel Serverless | Railway/Render |
|---------|-------------------|----------------|
| Conexões persistentes | ❌ Não | ✅ Sim |
| SSH Tunnel | ❌ Não | ✅ Sim |
| Timeout | ⏱️ 10s (60s Pro) | ✅ Ilimitado |
| Cold start | ❌ ~500ms | ✅ Não tem |
| WebSockets | ❌ Limitado | ✅ Total |
| Background jobs | ❌ Não | ✅ Sim |
| Custo previsível | ⚠️ Por invocação | ✅ Fixo mensal |

## 🏁 Conclusão

**Use Vercel Serverless se:**
- ✅ Tráfego baixo/esporádico
- ✅ Requisições simples e rápidas
- ✅ Já usa Neon/Supabase (otimizados)

**Use Railway/Render se:**
- ✅ Precisa de SSH tunnel
- ✅ Conexões de longa duração
- ✅ Background jobs
- ✅ WebSockets
- ✅ Mais controle

---

**Recomendação:** Para este projeto, **Railway é mais adequado** devido ao uso de SSH tunnel e consultas complexas com views.
