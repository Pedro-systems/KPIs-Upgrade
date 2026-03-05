Perfeito! Vou ajustar o prompt para conexão direta com PostgreSQL na sua VPS:

---

**PROMPT PARA OPUS:**

Preciso que você crie uma aplicação web completa para gerenciar dados de um banco PostgreSQL rodando na minha VPS com as seguintes especificações:

## REQUISITOS GERAIS

1. **Backend em Node.js** com Express
2. **Frontend** em React (ou HTML/JS vanilla se preferir simplicidade)
3. **Conexão direta ao PostgreSQL** na VPS usando arquivo .env
4. **Interface com abas** - uma aba para cada tabela do banco
5. **Operações CRUD completas**: visualizar, criar, editar e deletar registros
6. **Confirmação antes de salvar** alterações
7. **Sistema de filtros** em todas as tabelas

## ESTRUTURA DO BANCO DE DADOS

O banco possui 5 tabelas principais:

### 1. **deals** - Negócios/Propriedades
- Campos financeiros: purchase_price, sale_price, profit, roi, gross_margin
- Campos de datas: purchase_date, sale_date
- Campos descritivos: property_description, status, entity, partners
- Métricas: acres, days_in_inventory

### 2. **campaigns** - Campanhas SMS/Text
- Métricas de performance: response_rate, lead_to_contract_rate
- Custos: campaign_cost, average_cost_per_lead
- Resultados: num_leads_generated, num_contracts_closed
- Filtros importantes: county, state, entity, channel, year, month

### 3. **call_campaigns** - Campanhas Cold Calling
- Similar a campaigns mas focado em chamadas telefônicas
- Métricas: leads_generated, contract_sent_to_contract_closed_rate
- Custos e margens por contrato

### 4. **mail_campaigns** - Campanhas Direct Mail
- Inclui sequence_number para sequências de envio
- Métricas de conversão e custos similares às outras campanhas

### 5. **expenses** - Despesas
- Compartilhamento entre sócios: alexa_share, imelda_share, rhea_share
- Campos: vendor_customer, account_name, account_type
- Reconciliação e balanceamento

## FUNCIONALIDADES REQUERIDAS

### Para CADA Tabela:

1. **Visualização em Grid/Tabela**
   - Paginação (50-100 registros por página)
   - Ordenação por colunas clicáveis
   - Destaque visual para valores importantes (negativos em vermelho, positivos em verde)

2. **Filtros Avançados**
   - Filtros por data (range)
   - Filtros por texto (busca parcial)
   - Filtros por valores numéricos (maior que, menor que, igual)
   - Filtros por status/categorias (dropdown)
   - Botão "Limpar Filtros"

3. **Operações**
   - **Criar**: Formulário modal com validação de campos obrigatórios
   - **Editar**: Click na linha abre modal de edição
   - **Deletar**: Botão com confirmação "Tem certeza?"
   - **Salvar**: Modal de confirmação mostrando o que será alterado

4. **Validações**
   - Campos numéricos devem aceitar apenas números
   - Datas em formato válido
   - Campos obrigatórios marcados com asterisco
   - Mensagens de erro claras

## ESTRUTURA DE ARQUIVOS ESPERADA

```
project/
├── backend/
│   ├── server.js
│   ├── config/
│   │   └── db.js (conexão PostgreSQL)
│   ├── routes/
│   │   ├── deals.js
│   │   ├── campaigns.js
│   │   ├── call_campaigns.js
│   │   ├── mail_campaigns.js
│   │   └── expenses.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TableView.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── EditModal.jsx
│   │   │   └── ConfirmDialog.jsx
│   │   ├── pages/
│   │   │   ├── Deals.jsx
│   │   │   ├── Campaigns.jsx
│   │   │   ├── CallCampaigns.jsx
│   │   │   ├── MailCampaigns.jsx
│   │   │   └── Expenses.jsx
│   │   ├── App.jsx
│   │   └── index.jsx
│   └── package.json
└── README.md
```

## CONFIGURAÇÃO .ENV

```env
# Database PostgreSQL (VPS)
DB_HOST=seu-ip-vps
DB_PORT=5432
DB_NAME=nome_do_banco
DB_USER=postgres
DB_PASSWORD=sua-senha

# Server
PORT=3001
NODE_ENV=development
```

## TECNOLOGIAS SUGERIDAS

**Backend:**
- express
- pg (node-postgres) ou pg-pool
- dotenv
- cors
- helmet (segurança)

**Frontend:**
- React + Vite
- Axios (para chamadas API)
- TailwindCSS ou Material-UI (para estilo)
- React Router (para navegação entre abas)
- date-fns (para formatação de datas)
- react-hot-toast (notificações)

## DETALHES IMPORTANTES

1. **Conexão PostgreSQL**: Pool de conexões para melhor performance
2. **Formatação de Valores**: 
   - Dinheiro com 2 casas decimais e símbolo $
   - Percentuais com símbolo %
   - Datas em formato DD/MM/YYYY (mas salvar como DATE no banco)
3. **Performance**: 
   - Implementar debounce nos filtros (300ms)
   - Usar prepared statements para prevenir SQL injection
4. **Feedback ao Usuário**: Toasts/notificações para sucesso/erro
5. **Responsive**: Interface deve funcionar em tablets
6. **Segurança**:
   - Validação de dados no backend
   - Sanitização de inputs
   - CORS configurado corretamente

## ENDPOINTS API (REST)

Para cada tabela, criar endpoints:

```
GET    /api/deals              - Listar (com filtros query params)
GET    /api/deals/:id          - Buscar por ID
POST   /api/deals              - Criar novo
PUT    /api/deals/:id          - Atualizar
DELETE /api/deals/:id          - Deletar

(Repetir para campaigns, call_campaigns, mail_campaigns, expenses)
```

## SCHEMA SQL

```sql
-- 1. TABELA DE DEALS (Negócios/Propriedades)
DROP TABLE IF EXISTS deals CASCADE;
CREATE TABLE deals (
    id SERIAL PRIMARY KEY,
    property_description TEXT,
    property_apn VARCHAR(100),
    acres DECIMAL(10, 2),
    campaign_type VARCHAR(50),
    entity VARCHAR(100),
    partners TEXT,
    status VARCHAR(50),
    purchase_date DATE,
    purchase_price DECIMAL(12, 2),
    funding_costs DECIMAL(12, 2),
    sale_date DATE,
    sale_year INTEGER,
    sale_price DECIMAL(12, 2),
    estimated_payback_date VARCHAR(50),
    closing_costs DECIMAL(12, 2),
    funding_payout DECIMAL(12, 2),
    total_costs DECIMAL(12, 2),
    revenue DECIMAL(12, 2),
    profit DECIMAL(12, 2),
    gross_profit DECIMAL(12, 2),
    days_in_inventory INTEGER,
    roi DECIMAL(10, 2),
    gross_margin DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE CAMPANHAS SMS/TEXT
DROP TABLE IF EXISTS campaigns CASCADE;
CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    date_created DATE,
    month VARCHAR(10),
    year INTEGER,
    county VARCHAR(100),
    state VARCHAR(10),
    entity VARCHAR(100),
    channel VARCHAR(50),
    is_campaign_complete BOOLEAN,
    campaign_size INTEGER,
    messages_delivered INTEGER,
    num_responses INTEGER,
    num_leads_generated INTEGER,
    num_contracts_sent INTEGER,
    num_contracts_closed INTEGER,
    num_contracts_cancelled INTEGER,
    response_rate DECIMAL(10, 2),
    response_to_lead_rate DECIMAL(10, 2),
    lead_to_contract_rate DECIMAL(10, 2),
    total_closing_proceeds DECIMAL(12, 2),
    average_closing_proceeds_per_contract DECIMAL(12, 2),
    campaign_cost DECIMAL(12, 2),
    average_cost_per_lead DECIMAL(12, 2),
    average_cost_per_contract DECIMAL(12, 2),
    margin_earned DECIMAL(12, 2),
    average_margin_per_contract DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE CAMPANHAS DE COLD CALLING
DROP TABLE IF EXISTS call_campaigns CASCADE;
CREATE TABLE call_campaigns (
    id SERIAL PRIMARY KEY,
    date_created DATE,
    month VARCHAR(10),
    year INTEGER,
    county VARCHAR(100),
    state VARCHAR(10),
    entity VARCHAR(100),
    is_campaign_complete BOOLEAN,
    campaign_size INTEGER,
    leads_generated INTEGER,
    num_contracts_sent INTEGER,
    num_contracts_closed INTEGER,
    num_contracts_cancelled INTEGER,
    response_rate DECIMAL(10, 2),
    lead_to_contract_sent_rate DECIMAL(10, 2),
    contract_sent_to_contract_closed_rate DECIMAL(10, 2),
    total_closing_proceeds DECIMAL(12, 2),
    average_margin_per_contract DECIMAL(12, 2),
    campaign_cost DECIMAL(12, 2),
    average_cost_per_lead DECIMAL(12, 2),
    average_cost_per_contract DECIMAL(12, 2),
    margin_earned DECIMAL(12, 2),
    average_margin_per_contract_2 DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA DE CAMPANHAS DE DIRECT MAIL
DROP TABLE IF EXISTS mail_campaigns CASCADE;
CREATE TABLE mail_campaigns (
    id SERIAL PRIMARY KEY,
    date_created DATE,
    month VARCHAR(10),
    year INTEGER,
    county VARCHAR(100),
    state VARCHAR(10),
    entity VARCHAR(100),
    sequence_number VARCHAR(10),
    is_campaign_complete BOOLEAN,
    campaign_size INTEGER,
    leads_generated INTEGER,
    num_contracts_sent INTEGER,
    num_contracts_closed INTEGER,
    num_contracts_cancelled INTEGER,
    response_rate DECIMAL(10, 2),
    lead_to_contract_sent_rate DECIMAL(10, 2),
    contract_sent_to_contract_closed_rate DECIMAL(10, 2),
    total_closing_proceeds DECIMAL(12, 2),
    average_closing_proceeds_per_contract DECIMAL(12, 2),
    campaign_cost DECIMAL(12, 2),
    average_cost_per_lead DECIMAL(12, 2),
    average_cost_per_contract DECIMAL(12, 2),
    margin_earned DECIMAL(12, 2),
    average_margin_per_contract DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA DE DESPESAS (EXPENSES)
DROP TABLE IF EXISTS expenses CASCADE;
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    date DATE,
    month VARCHAR(10),
    year INTEGER,
    description TEXT,
    vendor_customer VARCHAR(200),
    account_name VARCHAR(100),
    account_type VARCHAR(100),
    payer_recipient VARCHAR(100),
    amount DECIMAL(12, 2),
    balance DECIMAL(12, 2),
    reconciliation_status VARCHAR(10),
    income_expense_sharing VARCHAR(50),
    entity VARCHAR(100),
    alexa_share DECIMAL(12, 2),
    imelda_share DECIMAL(12, 2),
    rhea_share DECIMAL(12, 2),
    memo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

**POR FAVOR:**
1. Crie todos os arquivos necessários organizados na estrutura acima
2. Inclua comentários explicativos no código
3. Forneça instruções completas de instalação e execução no README
4. Implemente tratamento de erros robusto em todas as operações
5. Use async/await e try/catch para operações assíncronas
6. Configure pool de conexões PostgreSQL para melhor performance
7. Implemente validação de dados tanto no frontend quanto no backend
