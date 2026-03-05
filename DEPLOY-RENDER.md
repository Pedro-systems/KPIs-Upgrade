# 🚀 Deploy no Render - Guia Completo

## 📋 O que é o Render?

Render é uma plataforma de cloud hosting moderna que suporta:
- ✅ Conexões persistentes (diferente da Vercel)
- ✅ SSH Tunnels (funciona perfeitamente)
- ✅ Sem cold start
- ✅ Free tier generoso
- ✅ Deploy automático via Git

---

## 🎯 Arquitetura Final

```
Frontend (Vercel)                Backend (Render)
https://upgrade-kpis.vercel.app → https://upgrade-kpis-backend.onrender.com
                                        ↓
                                  PostgreSQL (via SSH)
                                  Seu VPS
```

---

## 📝 Passo 1: Preparar Repositório Git

```bash
# No diretório do projeto
git add .
git commit -m "Configure Render deployment"
git push origin main
```

**Se não tem Git configurado ainda:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/upgrade-kpis.git
git push -u origin main
```

---

## 🌐 Passo 2: Criar Conta no Render

1. Acesse: https://render.com
2. Clique em **"Get Started"**
3. Faça login com GitHub/GitLab/Bitbucket
4. Autorize o Render a acessar seus repositórios

---

## ➕ Passo 3: Criar Web Service no Render

### 3.1 No Dashboard do Render

1. Clique em **"New +"** no canto superior direito
2. Selecione **"Web Service"**
3. Conecte seu repositório Git
4. Selecione o repositório **"upgrade-kpis"** (ou nome do seu repo)
5. Clique em **"Connect"**

### 3.2 Configurar o Service

Preencha os campos conforme abaixo:

#### **Name (Nome do Serviço)**
```
upgrade-kpis-backend
```
*(Você pode escolher outro nome, mas anote a URL final)*

#### **Region (Região)**
```
Oregon (US West)
```
*(Ou escolha a região mais próxima do seu VPS)*

#### **Branch**
```
main
```
*(Ou master, dependendo do seu Git)*

#### **Root Directory**
```
backend
```
⚠️ **IMPORTANTE:** Digite exatamente `backend` aqui!

#### **Runtime**
```
Node
```

#### **Build Command**
```
npm install
```

#### **Start Command**
```
npm start
```

#### **Plan**
Selecione:
```
Free ($0/month)
```
- ✅ 512 MB RAM
- ✅ 0.1 CPU
- ✅ Suficiente para este projeto
- ⚠️ Dorme após 15 min de inatividade (primeiro request demora ~30s)

**Upgrade para Starter ($7/mês) se precisar de:**
- Sem sleep automático
- Mais recursos
- SSL customizado

---

## 🔐 Passo 4: Configurar Environment Variables

Ainda na página de criação, role até **"Environment Variables"** e adicione:

### Variáveis Obrigatórias

#### 1. NODE_ENV
```
Key: NODE_ENV
Value: production
```

#### 2. PORT
```
Key: PORT
Value: 3001
```

#### 3. FRONTEND_URL
```
Key: FRONTEND_URL
Value: https://upgrade-kpis.vercel.app
```
⚠️ **Substitua** pela URL real do seu frontend na Vercel!

---

### Variáveis do Banco de Dados

#### Opção A: Conexão Direta (Sem SSH Tunnel)

Se seu PostgreSQL aceita conexões diretas:

```
Key: USE_SSH_TUNNEL
Value: false

Key: DB_HOST
Value: seu-vps-ip.com

Key: DB_PORT
Value: 5432

Key: DB_NAME
Value: kpis_production

Key: DB_USER
Value: admin

Key: DB_PASSWORD
Value: sua_senha_segura_aqui
```

#### Opção B: Com SSH Tunnel (Seu Caso Atual)

```
Key: USE_SSH_TUNNEL
Value: true

Key: DB_HOST
Value: localhost

Key: DB_PORT
Value: 5432

Key: DB_NAME
Value: kpis_production

Key: DB_USER
Value: admin

Key: DB_PASSWORD
Value: sua_senha_do_postgres

Key: SSH_HOST
Value: seu-vps-ip.com

Key: SSH_PORT
Value: 22

Key: SSH_USER
Value: root

Key: SSH_PRIVATE_KEY_PATH
Value: /opt/render/.ssh/id_rsa

Key: SSH_FORWARD_PORT
Value: 5432

Key: SSH_FORWARD_HOST
Value: localhost
```

---

## 🔑 Passo 5: Configurar SSH Key no Render (Se usa SSH Tunnel)

### 5.1 Gerar ou Usar SSH Key Existente

No seu computador local:

```powershell
# Ver se já tem uma chave
cat ~\.ssh\id_rsa.pub

# Se não tiver, gerar nova
ssh-keygen -t rsa -b 4096 -C "render-deploy"
# Pressione Enter 3x (sem senha)
```

### 5.2 Adicionar Chave Pública no VPS

Copie o conteúdo de `~\.ssh\id_rsa.pub` e adicione no VPS:

```bash
# No seu VPS (via SSH)
nano ~/.ssh/authorized_keys
# Cole a chave pública aqui
# Salve: Ctrl+O, Enter, Ctrl+X
```

### 5.3 Adicionar Chave Privada no Render

#### Método 1: Via Secret Files (Recomendado)

1. No Render Dashboard, vá em **"Environment"** > **"Secret Files"**
2. Clique em **"Add Secret File"**
3. Preencha:
   ```
   Filename: .ssh/id_rsa
   Contents: [Cole o conteúdo de ~\.ssh\id_rsa]
   ```
4. Clique em **"Save"**

#### Método 2: Via Environment Variable (Alternativa)

Se Secret Files não funcionar, adicione como variável:

```
Key: SSH_PRIVATE_KEY
Value: -----BEGIN OPENSSH PRIVATE KEY-----
       [Cole o conteúdo completo da chave privada aqui]
       -----END OPENSSH PRIVATE KEY-----
```

E atualize `backend/config/db.js` para ler de `process.env.SSH_PRIVATE_KEY` em vez do arquivo.

---

## 🚀 Passo 6: Deploy!

1. Role até o final da página
2. Clique em **"Create Web Service"**
3. Aguarde o build (2-5 minutos)
4. Acompanhe os logs em tempo real

### O que você verá nos logs:

```
==> Cloning from https://github.com/...
==> Checking out commit ...
==> Running build command: npm install
npm install
...
added 245 packages
==> Starting service with: npm start
╔═══════════════════════════════════════════════════╗
║   🚀 Servidor rodando na porta 3001              ║
║   📊 API URL: http://localhost:3001/api          ║
║   🔧 Ambiente: production                        ║
╚═══════════════════════════════════════════════════╝
```

---

## ✅ Passo 7: Testar o Backend

Após deploy bem-sucedido, sua URL será:
```
https://upgrade-kpis-backend.onrender.com
```

### Testar Health Check

```bash
curl https://upgrade-kpis-backend.onrender.com/api/health
```

Resposta esperada:
```json
{
  "status": "OK",
  "message": "API funcionando corretamente",
  "timestamp": "2026-03-05T..."
}
```

### Testar Endpoints

```bash
# Agentes (daily)
curl https://upgrade-kpis-backend.onrender.com/api/datakpi/daily

# Dashboard Overview
curl https://upgrade-kpis-backend.onrender.com/api/crossview/overview

# Deals
curl https://upgrade-kpis-backend.onrender.com/api/deals
```

---

## 🎨 Passo 8: Conectar Frontend ao Backend

### 8.1 Atualizar Vercel Environment Variables

1. Vá no Dashboard da Vercel
2. Selecione seu projeto frontend
3. Vá em **Settings** > **Environment Variables**
4. Edite `VITE_API_URL`:
   ```
   VITE_API_URL=https://upgrade-kpis-backend.onrender.com/api
   ```
5. Clique em **"Save"**

### 8.2 Redesploy o Frontend

```bash
# Opção 1: Via Dashboard
# Vá em Deployments > Três pontos > Redeploy

# Opção 2: Via CLI
vercel --prod
```

---

## 🔄 Passo 9: Rodar Migrations

Após primeiro deploy, execute as migrations das views:

### Via Render Shell (Recomendado)

1. No Render Dashboard, vá em seu service
2. Clique na aba **"Shell"** no menu lateral
3. Execute:
   ```bash
   npm run migrate
   ```

### Via Curl (Alternativa)

Se tiver criado endpoint específico:
```bash
curl -X POST https://upgrade-kpis-backend.onrender.com/api/migrate
```

---

## 📊 Monitoramento

### Logs em Tempo Real

1. No Render Dashboard
2. Clique no seu service
3. Aba **"Logs"**
4. Veja requisições, erros, etc.

### Métricas

Aba **"Metrics"**:
- CPU Usage
- Memory Usage
- Request Count
- Response Time

---

## 🔧 Troubleshooting

### Erro: "Failed to connect to database"

**Causa:** SSH tunnel não configurado corretamente

**Solução:**
1. Verifique se a chave SSH está em **Secret Files**
2. Teste SSH manualmente do seu local:
   ```bash
   ssh -i ~/.ssh/id_rsa root@seu-vps-ip.com
   ```
3. Verifique logs do Render para erros específicos

### Erro: "ECONNREFUSED"

**Causa:** VPS não aceita conexões SSH ou PostgreSQL offline

**Solução:**
1. Verifique se VPS está online
2. Teste: `ping seu-vps-ip.com`
3. Verifique firewall do VPS permite SSH (porta 22)

### Erro: "CORS blocked"

**Causa:** FRONTEND_URL não configurado

**Solução:**
Adicione variável no Render:
```
FRONTEND_URL=https://upgrade-kpis.vercel.app
```

### Build demora muito

**Causa:** Free tier tem recursos limitados

**Solução:**
- Normal demorar 3-5 min no primeiro build
- Builds subsequentes são mais rápidos (~2 min)

### Service "sleeps" após inatividade

**Causa:** Free tier dorme após 15 minutos sem requests

**Solução:**
- Primeiro request após sleep demora ~30s
- Upgrade para Starter ($7/mês) para evitar sleep
- Ou use cron job para "pingar" a cada 10 min

---

## 🔄 Deploy Automático

Render faz deploy automático quando você faz push no Git!

```bash
# Fazer mudanças
git add .
git commit -m "Update feature"
git push origin main

# Render detecta e builda automaticamente!
```

---

## 💾 Backup do Banco

O Render NÃO faz backup do seu PostgreSQL (está no VPS).

**Configure backups no VPS:**

```bash
# No VPS, criar script de backup
nano /root/backup-postgres.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

pg_dump -U admin kpis_production > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

```bash
# Tornar executável
chmod +x /root/backup-postgres.sh

# Adicionar ao cron (diário às 3am)
crontab -e
# Adicione: 0 3 * * * /root/backup-postgres.sh
```

---

## 📋 Checklist Final

Antes de ir para produção:

- [ ] Backend deployado no Render sem erros
- [ ] Health check retorna 200 OK
- [ ] Environment variables configuradas
- [ ] SSH tunnel funcionando (ou conexão direta)
- [ ] Migrations executadas (views criadas)
- [ ] Frontend atualizado com URL do backend
- [ ] CORS configurado corretamente
- [ ] Todos endpoints testados
- [ ] Logs sem erros críticos
- [ ] Backup do banco configurado no VPS

---

## 💰 Custos

| Item | Custo |
|------|-------|
| Render Free Tier | $0/mês |
| Vercel Free Tier | $0/mês |
| VPS PostgreSQL | (Já tem) |
| **Total** | **$0/mês** |

### Se precisar escalar:

| Upgrade | Custo | Benefícios |
|---------|-------|-----------|
| Render Starter | $7/mês | Sem sleep, mais recursos |
| Vercel Pro | $20/mês | Analytics, mais bandwidth |
| Neon PostgreSQL | $19/mês | Backup automático, scaling |

---

## 🎯 Próximos Passos

Após deploy bem-sucedido:

1. **Monitore logs** nas primeiras 24h
2. **Configure alertas** (Render tem integração com PagerDuty/Slack)
3. **Documente URLs** de produção
4. **Configure CI/CD** se quiser testes automáticos
5. **Configure domínio customizado** (opcional)

---

## 🔗 Links Úteis

- Dashboard Render: https://dashboard.render.com
- Documentação: https://render.com/docs
- Status: https://status.render.com
- Suporte: https://render.com/support

---

## 📞 Suporte

Se tiver problemas:

1. **Logs do Render:** Primeira fonte de debug
2. **Render Community:** https://community.render.com
3. **Chat do Render:** Dashboard > ícone de chat
4. **Email:** support@render.com

---

**Última atualização:** 05/03/2026  
**Versão:** 1.0.0

🎉 **Boa sorte com o deploy!**
