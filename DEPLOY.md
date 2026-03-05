# 🚀 Guia de Deploy na Vercel - UpgradeKPIs

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Deploy do Frontend](#deploy-do-frontend)
4. [Deploy do Backend](#deploy-do-backend)
5. [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
6. [Banco de Dados em Produção](#banco-de-dados-em-produção)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

- [ ] Conta na Vercel (https://vercel.com)
- [ ] CLI da Vercel instalada: `npm install -g vercel`
- [ ] Repositório Git (GitHub, GitLab ou Bitbucket)
- [ ] PostgreSQL acessível publicamente (SEM SSH tunnel)

---

## 📁 Estrutura do Projeto

```
UpgradeKPIs/
├── frontend/          # React + Vite (Deploy na Vercel)
├── backend/           # Node.js + Express (Deploy separado)
├── vercel.json        # Configuração do frontend
├── package.json       # Root package para scripts
└── .env.example       # Template de variáveis
```

---

## 🎨 Deploy do Frontend (Vercel)

### Opção 1: Via Dashboard da Vercel (Recomendado)

1. **Push para Git:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Importar no Vercel:**
   - Acesse https://vercel.com/new
   - Conecte seu repositório Git
   - Selecione o repositório `UpgradeKPIs`

3. **Configurar Build:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Environment Variables:**
   Adicione em Settings > Environment Variables:
   ```
   VITE_API_URL=https://seu-backend-url.com/api
   ```

5. **Deploy:**
   - Clique em "Deploy"
   - Aguarde o build (~2-3 minutos)
   - URL gerada: `https://upgrade-kpis.vercel.app`

### Opção 2: Via CLI

```bash
cd frontend
vercel --prod
```

---

## 🖥️ Deploy do Backend

### ⚠️ IMPORTANTE: Vercel Serverless Limitations

O backend atual usa **SSH tunnel** que **NÃO funciona em serverless**. Você tem 3 opções:

### Opção A: Railway (Recomendado para este projeto)

**Vantagens:** Conexões persistentes, SSH tunnel funciona  
**Desvantagens:** Custo após free tier

1. **Criar conta:** https://railway.app
2. **Deploy:**
   ```bash
   cd backend
   railway login
   railway init
   railway up
   ```
3. **Configurar variáveis:**
   ```bash
   railway variables set DB_HOST=...
   railway variables set DB_PASSWORD=...
   ```
4. **URL gerada:** `https://seu-backend.railway.app`

### Opção B: Render.com

1. Conecte o repositório
2. Selecione `backend` como pasta
3. Configure variáveis de ambiente
4. Deploy automático

### Opção C: Adaptar para Vercel Serverless

**⚠️ Requer mudanças significativas:**

1. **Remover SSH tunnel** - conexão direta ao PostgreSQL
2. **Converter para Serverless Functions:**
   ```
   backend/
   └── api/
       ├── deals.js
       ├── campaigns.js
       └── ...
   ```
3. **Cada rota vira uma função separada**
4. **Não mantém estado entre requisições**

**Exemplo de conversão:**
```javascript
// backend/api/deals.js
const { query } = require('../config/db');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const result = await query('SELECT * FROM deals');
    return res.json({ data: result.rows });
  }
  return res.status(405).json({ error: 'Method not allowed' });
};
```

---

## 🔐 Configuração de Variáveis de Ambiente

### Frontend (Vercel Dashboard)

1. Vá em: **Settings** > **Environment Variables**
2. Adicione:
   ```
   VITE_API_URL=https://seu-backend-url.com/api
   ```
3. Redeploy automático

### Backend (Railway/Render)

Configure todas do `.env.example`:
```bash
DB_HOST=seu-postgres-host.com
DB_PORT=5432
DB_NAME=kpis_production
DB_USER=admin
DB_PASSWORD=SENHA_SUPER_SEGURA
USE_SSH_TUNNEL=false
NODE_ENV=production
FRONTEND_URL=https://upgrade-kpis.vercel.app
```

---

## 💾 Banco de Dados em Produção

### Opção 1: Neon.tech (Recomendado)

- ✅ PostgreSQL serverless
- ✅ Free tier generoso
- ✅ Sem SSH tunnel necessário
- ✅ Pooling automático

**Setup:**
1. https://neon.tech
2. Crie novo projeto
3. Copie connection string
4. Use diretamente (sem SSH)

### Opção 2: Supabase

- ✅ PostgreSQL gerenciado
- ✅ Dashboard visual
- ✅ APIs REST automáticas

### Opção 3: Railway PostgreSQL

- ✅ Integração direta com backend
- ✅ Backups automáticos

### ⚠️ Não Recomendado para Produção:

- ❌ SSH tunnel (não funciona em serverless)
- ❌ Banco local
- ❌ Conexões não SSL

---

## 🔄 Workflow Completo de Deploy

```bash
# 1. Prepare o código
git add .
git commit -m "Deploy production"
git push origin main

# 2. Deploy Frontend (automático se conectado ao Git)
# Vercel detecta push e builda automaticamente

# 3. Deploy Backend (Railway)
cd backend
railway up

# 4. Atualizar variáveis no Vercel
vercel env add VITE_API_URL production
# Cole: https://seu-backend.railway.app/api

# 5. Rodar migrations
railway run node -e "require('./config/db').runViewMigration()"

# 6. Testar
curl https://upgrade-kpis.vercel.app
curl https://seu-backend.railway.app/api/health
```

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

**Causa:** SSH tunnel não funciona em serverless  
**Solução:** Use conexão direta ao PostgreSQL

```javascript
// backend/config/db.js
if (process.env.USE_SSH_TUNNEL === 'true') {
  // Desabilitar em produção!
  throw new Error('SSH tunnel não suportado em serverless');
}
```

### Erro: "CORS blocked"

**Causa:** FRONTEND_URL não configurado  
**Solução:** Adicione no backend:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

### Frontend não atualiza após deploy

**Solução:**
```bash
# Forçar rebuild
vercel --prod --force

# Limpar cache
vercel build --prod --debug
```

### Build falha com "Module not found"

**Causa:** Dependências não instaladas  
**Solução:** Verifique `package.json`:

```json
{
  "scripts": {
    "vercel-build": "npm install && npm run build"
  }
}
```

### Erro 500 em produção (funciona local)

**Debug:**
```bash
# Ver logs do frontend
vercel logs

# Ver logs do backend (Railway)
railway logs

# Testar variáveis
railway run printenv | grep DB
```

---

## 📊 Monitoramento

### Vercel Analytics

1. Vá em: **Analytics** tab
2. Ative Web Analytics
3. Veja performance em tempo real

### Backend Logs

**Railway:**
```bash
railway logs --tail
```

**Render:**
Dashboard > Logs tab

---

## 🔒 Segurança

### Checklist:

- [ ] `.env` no `.gitignore`
- [ ] Variáveis sensíveis no dashboard (não no código)
- [ ] SSL/TLS habilitado (automático na Vercel)
- [ ] CORS configurado corretamente
- [ ] Rate limiting no backend
- [ ] Validação de inputs
- [ ] Prepared statements (já implementado)

---

## 💰 Custos Estimados

| Serviço | Free Tier | Custo Mensal |
|---------|-----------|--------------|
| Vercel (Frontend) | ✅ 100GB bandwidth | $0 - $20 |
| Railway (Backend) | ✅ $5 crédito | $5 - $20 |
| Neon (PostgreSQL) | ✅ 1 projeto | $0 - $19 |
| **Total** | **Viável no free tier** | **$0 - $59** |

---

## 🎯 Arquitetura Final

```
Internet
   │
   ├─── Vercel (Frontend)
   │    https://upgrade-kpis.vercel.app
   │    └─ React + Vite (Static)
   │
   └─── Railway/Render (Backend)
        https://upgrade-kpis-api.railway.app
        └─ Express + Node.js
           └─ PostgreSQL (Neon/Railway)
```

---

## 📝 Checklist Final

Antes de fazer deploy:

- [ ] `.env.example` criado e documentado
- [ ] `.gitignore` configurado (sem `.env` commitado)
- [ ] SSH tunnel desabilitado (`USE_SSH_TUNNEL=false`)
- [ ] PostgreSQL acessível via internet
- [ ] CORS configurado com URLs corretas
- [ ] Build scripts funcionando (`npm run build`)
- [ ] Migrations testadas
- [ ] Health check endpoint funcionando
- [ ] Frontend testado localmente com backend de produção
- [ ] Backups do banco configurados

---

## 🆘 Suporte

**Problemas comuns:**
- `ECONNREFUSED`: Porta ou host errado
- `SSL required`: Adicione `?sslmode=require` na connection string
- `CORS error`: Verifique `FRONTEND_URL` no backend

**Documentação:**
- Vercel: https://vercel.com/docs
- Railway: https://docs.railway.app
- Neon: https://neon.tech/docs

---

**Última atualização:** 05/03/2026  
**Versão:** 1.0.0
