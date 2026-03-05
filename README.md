# Rhea KPIs - Sistema de Gerenciamento

Sistema web completo para gerenciamento de dados de negócios imobiliários, campanhas de marketing e despesas.

## Estrutura do Projeto

```
UpgradeKPIs/
├── backend/
│   ├── config/
│   │   └── db.js              # Conexão PostgreSQL (Pool)
│   ├── routes/
│   │   ├── deals.js           # CRUD Negócios/Propriedades
│   │   ├── campaigns.js       # CRUD Campanhas SMS/Text
│   │   ├── call_campaigns.js  # CRUD Campanhas Cold Calling
│   │   ├── mail_campaigns.js  # CRUD Campanhas Direct Mail
│   │   └── expenses.js        # CRUD Despesas
│   ├── server.js              # Servidor Express principal
│   ├── package.json
│   └── .env.example
├── frontend/                  # (Em desenvolvimento)
└── README.md
```

## Backend

### Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **pg (node-postgres)** - Cliente PostgreSQL com pool de conexões
- **express-validator** - Validação de dados
- **helmet** - Segurança HTTP
- **cors** - Cross-Origin Resource Sharing
- **dotenv** - Variáveis de ambiente

### Instalação

1. **Clone ou acesse o projeto**

2. **Configure as variáveis de ambiente**
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` com suas credenciais:
   ```env
   DB_HOST=seu-ip-vps
   DB_PORT=5432
   DB_NAME=nome_do_banco
   DB_USER=postgres
   DB_PASSWORD=sua-senha
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

3. **Instale as dependências**
   ```bash
   npm install
   ```

4. **Execute o servidor**
   ```bash
   # Desenvolvimento (com hot reload)
   npm run dev
   
   # Produção
   npm start
   ```

### Endpoints da API

Base URL: `http://localhost:3001/api`

#### Health Check
- `GET /api/health` - Verifica status da API

#### Deals (Negócios/Propriedades)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/deals` | Lista todos (com filtros e paginação) |
| GET | `/api/deals/:id` | Busca por ID |
| POST | `/api/deals` | Cria novo registro |
| PUT | `/api/deals/:id` | Atualiza registro |
| DELETE | `/api/deals/:id` | Remove registro |
| GET | `/api/deals/stats/summary` | Estatísticas resumidas |

#### Campaigns (Campanhas SMS/Text)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/campaigns` | Lista todos |
| GET | `/api/campaigns/:id` | Busca por ID |
| POST | `/api/campaigns` | Cria novo registro |
| PUT | `/api/campaigns/:id` | Atualiza registro |
| DELETE | `/api/campaigns/:id` | Remove registro |
| GET | `/api/campaigns/filters/options` | Opções para filtros |

#### Call Campaigns (Cold Calling)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/call-campaigns` | Lista todos |
| GET | `/api/call-campaigns/:id` | Busca por ID |
| POST | `/api/call-campaigns` | Cria novo registro |
| PUT | `/api/call-campaigns/:id` | Atualiza registro |
| DELETE | `/api/call-campaigns/:id` | Remove registro |
| GET | `/api/call-campaigns/filters/options` | Opções para filtros |

#### Mail Campaigns (Direct Mail)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/mail-campaigns` | Lista todos |
| GET | `/api/mail-campaigns/:id` | Busca por ID |
| POST | `/api/mail-campaigns` | Cria novo registro |
| PUT | `/api/mail-campaigns/:id` | Atualiza registro |
| DELETE | `/api/mail-campaigns/:id` | Remove registro |
| GET | `/api/mail-campaigns/filters/options` | Opções para filtros |

#### Expenses (Despesas)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/expenses` | Lista todos |
| GET | `/api/expenses/:id` | Busca por ID |
| POST | `/api/expenses` | Cria novo registro |
| PUT | `/api/expenses/:id` | Atualiza registro |
| DELETE | `/api/expenses/:id` | Remove registro |
| GET | `/api/expenses/filters/options` | Opções para filtros |
| GET | `/api/expenses/stats/summary` | Estatísticas resumidas |

### Filtros e Paginação

Todos os endpoints de listagem suportam:

**Paginação:**
```
GET /api/deals?page=1&limit=50
```

**Ordenação:**
```
GET /api/deals?sortBy=profit&sortOrder=DESC
```

**Filtros (exemplo para deals):**
```
GET /api/deals?status=Active&entity=Rhea&min_profit=1000&purchase_date_start=2024-01-01
```

**Filtros disponíveis por tabela:**

- **Deals**: status, entity, partners, purchase_date_start/end, sale_date_start/end, min/max_profit, min/max_acres, search
- **Campaigns**: county, state, entity, channel, year, month, is_campaign_complete, date_start/end, min_leads, min_contracts_closed
- **Call Campaigns**: county, state, entity, year, month, is_campaign_complete, date_start/end, min_leads, min_contracts_closed
- **Mail Campaigns**: county, state, entity, year, month, sequence_number, is_campaign_complete, date_start/end, min_leads, min_contracts_closed
- **Expenses**: vendor_customer, account_name, account_type, entity, year, month, payer_recipient, reconciliation_status, date_start/end, min/max_amount, search

### Exemplo de Resposta

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalCount": 150,
    "totalPages": 3
  }
}
```

### Tratamento de Erros

A API retorna erros padronizados:

```json
{
  "error": true,
  "message": "Descrição do erro",
  "details": [...] // opcional, para erros de validação
}
```

Códigos HTTP:
- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Erro de validação
- `404` - Não encontrado
- `500` - Erro interno do servidor

## Segurança

- **Helmet** - Headers HTTP seguros
- **CORS** - Configurado para aceitar apenas origens permitidas
- **Prepared Statements** - Prevenção contra SQL Injection
- **Validação** - Todos os inputs são validados com express-validator
- **Pool de Conexões** - Gerenciamento eficiente de conexões PostgreSQL

## Schema do Banco de Dados

O schema SQL completo está disponível no arquivo `instructions.md`. As 5 tabelas são:

1. **deals** - Negócios/Propriedades (24 campos)
2. **campaigns** - Campanhas SMS/Text (27 campos)
3. **call_campaigns** - Campanhas Cold Calling (24 campos)
4. **mail_campaigns** - Campanhas Direct Mail (25 campos)
5. **expenses** - Despesas (18 campos)

## Próximos Passos

- [ ] Implementar frontend React
- [ ] Adicionar autenticação JWT
- [ ] Implementar logs de auditoria
- [ ] Adicionar testes automatizados
