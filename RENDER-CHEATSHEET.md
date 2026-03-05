# 📋 RENDER - Valores para Preencher (Cola do Lado)

Use este arquivo como referência rápida durante o setup no Render.

---

## 🔧 CONFIGURAÇÕES BÁSICAS

| Campo | Valor |
|-------|-------|
| **Name** | `upgrade-kpis-backend` |
| **Region** | `Oregon (US West)` |
| **Branch** | `main` |
| **Root Directory** | `backend` ⚠️ IMPORTANTE! |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | `Free` |

---

## 🔐 ENVIRONMENT VARIABLES

### Básicas (Copie e cole)

```
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://upgrade-kpis.vercel.app
```
⚠️ **Substitua FRONTEND_URL** pela URL real do seu frontend!

---

### PostgreSQL + SSH Tunnel (Seu Caso)

```
USE_SSH_TUNNEL=true
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kpis_production
DB_USER=admin
DB_PASSWORD=[COLOQUE SUA SENHA AQUI]
SSH_HOST=[IP DO SEU VPS]
SSH_PORT=22
SSH_USER=root
SSH_PRIVATE_KEY_PATH=/opt/render/.ssh/id_rsa
SSH_FORWARD_PORT=5432
SSH_FORWARD_HOST=localhost
```

**⚠️ VOCÊ PRECISA SUBSTITUIR:**
- `DB_PASSWORD` → Senha do PostgreSQL
- `SSH_HOST` → IP ou domínio do seu VPS
- `SSH_USER` → Usuário SSH (geralmente `root` ou `ubuntu`)

---

### Ou: PostgreSQL Direto (Sem SSH)

Se configurar seu PostgreSQL para aceitar conexões diretas:

```
USE_SSH_TUNNEL=false
DB_HOST=[IP DO SEU VPS]
DB_PORT=5432
DB_NAME=kpis_production
DB_USER=admin
DB_PASSWORD=[COLOQUE SUA SENHA AQUI]
```

---

## 🔑 SSH KEY (Se usar SSH Tunnel)

### No Render: Secret Files

```
Filename: .ssh/id_rsa
Contents: [Cole a chave privada do arquivo ~/.ssh/id_rsa]
```

### Como pegar a chave no Windows:

```powershell
# PowerShell
cat ~\.ssh\id_rsa

# Copie TUDO, incluindo:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...conteúdo...
# -----END OPENSSH PRIVATE KEY-----
```

### Adicionar chave pública no VPS:

```bash
# SSH no VPS
ssh root@SEU-VPS-IP

# Editar authorized_keys
nano ~/.ssh/authorized_keys

# Cole a chave pública (arquivo ~/.ssh/id_rsa.pub)
# Salve: Ctrl+O, Enter, Ctrl+X
```

---

## ✅ CHECKLIST DURANTE SETUP

### Antes de clicar "Create Web Service":

- [ ] Root Directory = `backend` ✅ CRÍTICO!
- [ ] Build Command = `npm install`
- [ ] Start Command = `npm start`
- [ ] Plan = Free (ou Starter se quiser sem sleep)

### Environment Variables configuradas:

- [ ] `NODE_ENV` = production
- [ ] `PORT` = 3001
- [ ] `FRONTEND_URL` = (URL do Vercel)
- [ ] `USE_SSH_TUNNEL` = true ou false
- [ ] `DB_HOST`, `DB_PORT`, `DB_NAME` configurados
- [ ] `DB_USER` e `DB_PASSWORD` configurados
- [ ] Se SSH: todas variáveis `SSH_*` configuradas

### Se usar SSH Tunnel:

- [ ] Secret File `.ssh/id_rsa` criado
- [ ] Chave pública adicionada no VPS (`~/.ssh/authorized_keys`)
- [ ] Testado SSH do local: `ssh root@SEU-VPS-IP`

---

## 🧪 TESTAR APÓS DEPLOY

```bash
# 1. Health check
curl https://upgrade-kpis-backend.onrender.com/api/health

# Deve retornar:
# {"status":"OK","message":"API funcionando corretamente","timestamp":"..."}

# 2. Testar endpoint
curl https://upgrade-kpis-backend.onrender.com/api/datakpi/daily

# Deve retornar JSON com dados
```

---

## 🚨 PROBLEMAS COMUNS

### "Failed to connect to database"
→ Verifique variáveis `DB_*` e `SSH_*`
→ Veja logs no Render para erro específico

### "ECONNREFUSED" ou "ETIMEDOUT"
→ VPS pode estar offline
→ Firewall bloqueando porta 22 (SSH)
→ Teste: `ping SEU-VPS-IP`

### Build falha com "Cannot find module"
→ Root Directory precisa ser `backend`!
→ Verifique se está exatamente assim

### "CORS error" no frontend
→ Configure `FRONTEND_URL` no backend
→ Deve ser a URL completa do Vercel

---

## 📞 ANOTAÇÕES PESSOAIS

Cole aqui suas informações específicas:

```
MEU VPS IP: _____________________
MEU DB_PASSWORD: _____________________
MINHA URL RENDER: _____________________
MINHA URL VERCEL: _____________________

Primeira tentativa em: ___/___/____
Status: [ ] OK  [ ] Com problemas
```

---

## 🎯 DEPOIS DO DEPLOY

1. Copie a URL gerada pelo Render
2. Vá no Vercel Dashboard
3. Settings > Environment Variables
4. Edite `VITE_API_URL` para: `https://SEU-BACKEND.onrender.com/api`
5. Redeploy o frontend

---

## 🔄 RODAR MIGRATIONS

Após primeiro deploy, no Render Shell ou localmente conectado:

```bash
npm run migrate
```

Vai criar as 7 views necessárias no PostgreSQL.

---

## ⏱️ EXPECTATIVA DE TEMPO

- Setup no Render: ~5-10 minutos
- Primeiro build: ~3-5 minutos
- Builds seguintes: ~2 minutos
- Primeiro request (free tier): ~30s (cold start)

---

**Data:** ___/___/____  
**Status:** [ ] Aguardando [ ] Em andamento [ ] ✅ Concluído
