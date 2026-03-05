# Claude Code — Refactor: Migrate Inline SQL to Views + Add DataKPI Cross-Data Layer

## Project Location
```
C:\Users\pedro\OneDrive\Área de Trabalho\projetos\Rhea\UpgradeKPIs\
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── config/db.js
│   └── routes/
│       ├── call_campaigns.js
│       ├── campaigns.js
│       ├── deals.js
│       ├── expenses.js
│       ├── mail_campaigns.js
│       └── summary.js
└── frontend/
    └── src/
        ├── App.jsx
        ├── services/api.js
        ├── pages/
        │   ├── SummaryDashboard.jsx  ← main dashboard (32KB)
        │   ├── TextAnalytics.jsx
        │   ├── CallAnalytics.jsx
        │   ├── MailAnalytics.jsx
        │   ├── Campaigns.jsx
        │   ├── CallCampaigns.jsx
        │   ├── MailCampaigns.jsx
        │   ├── Deals.jsx
        │   └── Expenses.jsx
        └── components/
            ├── DataTable.jsx
            ├── EditModal.jsx
            ├── FilterBar.jsx
            ├── Layout.jsx
            ├── ConfirmDialog.jsx
            └── Pagination.jsx
```

---

## Context

This is an existing Node.js + Express + React (Vite + Tailwind) project. The backend currently has inline SQL queries directly inside each route file. The frontend already has all pages and components built and working.

**The goal is NOT to rebuild anything. The goal is to:**
1. Read all existing files first to understand what's already there
2. Create SQL Views in PostgreSQL that handle the data cross-joining logic
3. Refactor the route files to query the views instead of raw tables
4. Add a new `datakpi.js` route for `DataAirtable.DataKPI` table (does not exist yet)
5. Add a new `crossview.js` route that joins agent KPIs with campaign results by month
6. Update `frontend/src/services/api.js` to add the new endpoints
7. Update `SummaryDashboard.jsx` to consume the new cross-view data

**Do not modify:** `DataTable.jsx`, `EditModal.jsx`, `FilterBar.jsx`, `ConfirmDialog.jsx`, `Pagination.jsx`, `formatters.js`, `index.css` — these are working UI utilities, leave them untouched.

---

## Step 0 — Read Before Touching Anything

Before writing a single line of code, read these files in full:
- `backend/config/db.js` — understand how the DB connection works
- `backend/server.js` — understand how routes are registered
- `backend/routes/summary.js` — this is the largest route file, understand its query patterns
- `backend/routes/campaigns.js` — understand the inline SQL style used throughout
- `frontend/src/services/api.js` — understand how the frontend calls the backend
- `frontend/src/pages/SummaryDashboard.jsx` — understand what data it currently consumes

Only after reading all 6 files, proceed with the steps below.

---

## Step 1 — Create SQL Views File

Create a new file: `backend/sql/views.sql`

This file should be the source of truth for all views. Add a comment header on each view explaining what it does and which tables it joins.

### View 1: `v_agent_daily`
Reads `DataAirtable.DataKPI` with no aggregation. Just a clean view with snake_case aliases for all columns to make the JS layer consistent:

```sql
CREATE OR REPLACE VIEW v_agent_daily AS
SELECT
  "ID"                        AS id,
  "Name"                      AS agent_name,
  "Data"                      AS activity_date,
  DATE_TRUNC('month', "Data") AS activity_month,
  EXTRACT(YEAR FROM "Data")   AS activity_year,
  "SMS Send"                  AS sms_sent,
  "SMS Leads"                 AS sms_leads,
  "Cold Calls Made"           AS cold_calls_made,
  "Cold Call Leads"           AS cold_call_leads,
  "Follow-Ups Calls Made"     AS followups_made,
  "Mail Calls Received"       AS mail_calls_received,
  "Mail Leads"                AS mail_leads,
  "Total Inbound Leads"       AS total_inbound_leads,
  "Hot Leads"                 AS hot_leads,
  "Warm Leads"                AS warm_leads,
  "Rejected Leads"            AS rejected_leads,
  "Offers Sent"               AS offers_sent,
  "Contracts Sent"            AS contracts_sent,
  "Signed Contracts"          AS signed_contracts,
  "Successful Conversations"  AS successful_conversations,
  "SMS Lead Rate"             AS sms_lead_rate,
  "Cold Call Rate"            AS cold_call_rate,
  "Lead to Offer"             AS lead_to_offer_rate,
  "Close Rate"                AS close_rate,
  "Created Time"              AS created_time
FROM "DataAirtable"."DataKPI";
```

### View 2: `v_agent_monthly`
Aggregates `v_agent_daily` by agent + month:

```sql
CREATE OR REPLACE VIEW v_agent_monthly AS
SELECT
  agent_name,
  activity_month                    AS month,
  EXTRACT(YEAR FROM activity_month) AS year,
  SUM(sms_sent)                     AS total_sms_sent,
  SUM(sms_leads)                    AS total_sms_leads,
  SUM(cold_calls_made)              AS total_cold_calls,
  SUM(cold_call_leads)              AS total_cold_call_leads,
  SUM(followups_made)               AS total_followups,
  SUM(total_inbound_leads)          AS total_inbound_leads,
  SUM(hot_leads)                    AS total_hot_leads,
  SUM(warm_leads)                   AS total_warm_leads,
  SUM(offers_sent)                  AS total_offers_sent,
  SUM(contracts_sent)               AS total_contracts_sent,
  SUM(signed_contracts)             AS total_signed_contracts,
  SUM(successful_conversations)     AS total_conversations,
  ROUND(AVG(NULLIF(close_rate, 0)), 4)     AS avg_close_rate,
  ROUND(AVG(NULLIF(cold_call_rate, 0)), 4) AS avg_cold_call_rate,
  ROUND(AVG(NULLIF(sms_lead_rate, 0)), 4)  AS avg_sms_lead_rate
FROM v_agent_daily
GROUP BY agent_name, activity_month;
```

### View 3: `v_channel_pipeline`
UNION ALL of the 3 campaign tables into one normalized schema:

```sql
CREATE OR REPLACE VIEW v_channel_pipeline AS

SELECT
  'SMS' AS channel,
  date_created, month, year, county, state, entity,
  num_leads_generated       AS leads,
  campaign_cost             AS cost,
  num_contracts_sent        AS contracts_sent,
  num_contracts_closed      AS contracts_closed,
  response_rate,
  average_cost_per_lead     AS cost_per_lead,
  campaign_size
FROM public.campaigns

UNION ALL

SELECT
  'Cold Call' AS channel,
  date_created, month, year, county, state, entity,
  leads_generated           AS leads,
  campaign_cost             AS cost,
  num_contracts_sent        AS contracts_sent,
  num_contracts_closed      AS contracts_closed,
  response_rate,
  average_cost_per_lead     AS cost_per_lead,
  campaign_size
FROM public.call_campaigns

UNION ALL

SELECT
  'Direct Mail' AS channel,
  date_created, month, year, county, state, entity,
  leads_generated           AS leads,
  campaign_cost             AS cost,
  num_contracts_sent        AS contracts_sent,
  num_contracts_closed      AS contracts_closed,
  response_rate,
  average_cost_per_lead     AS cost_per_lead,
  campaign_size
FROM public.mail_campaigns;
```

### View 4: `v_financial_monthly`
Join expenses with deals profit, grouped by month/year/entity:

```sql
CREATE OR REPLACE VIEW v_financial_monthly AS
SELECT
  e.year,
  e.month,
  e.entity,
  SUM(CASE WHEN e.account_type ILIKE '%income%' THEN e.amount ELSE 0 END)     AS total_income,
  SUM(CASE WHEN e.account_type NOT ILIKE '%income%' THEN ABS(e.amount) ELSE 0 END) AS total_expenses,
  COALESCE(d.deals_profit, 0)   AS deals_profit,
  COALESCE(d.deals_revenue, 0)  AS deals_revenue,
  COALESCE(d.deals_count, 0)    AS deals_closed
FROM public.expenses e
LEFT JOIN (
  SELECT
    TO_CHAR(sale_date, 'Mon') AS month,
    EXTRACT(YEAR FROM sale_date)::int AS year,
    entity,
    SUM(profit)     AS deals_profit,
    SUM(revenue)    AS deals_revenue,
    COUNT(*)        AS deals_count
  FROM public.deals
  WHERE sale_date IS NOT NULL
  GROUP BY TO_CHAR(sale_date, 'Mon'), EXTRACT(YEAR FROM sale_date), entity
) d ON d.month = e.month AND d.year = e.year AND d.entity = e.entity
GROUP BY e.year, e.month, e.entity, d.deals_profit, d.deals_revenue, d.deals_count;
```

### View 5: `v_dashboard_overview`
Single-row summary for the KPI cards at the top of the dashboard:

```sql
CREATE OR REPLACE VIEW v_dashboard_overview AS
SELECT
  -- Agent KPIs
  (SELECT SUM("Signed Contracts") FROM "DataAirtable"."DataKPI")  AS total_signed_contracts,
  (SELECT SUM("Offers Sent")      FROM "DataAirtable"."DataKPI")  AS total_offers_sent,
  (SELECT SUM("Hot Leads")        FROM "DataAirtable"."DataKPI")  AS total_hot_leads,
  (SELECT COUNT(DISTINCT "Name")  FROM "DataAirtable"."DataKPI")  AS total_agents,

  -- Pipeline KPIs (all channels combined)
  (SELECT SUM(leads) FROM v_channel_pipeline)                     AS total_leads_all_channels,
  (SELECT SUM(cost)  FROM v_channel_pipeline)                     AS total_campaign_spend,
  (SELECT COUNT(*)   FROM v_channel_pipeline)                     AS total_campaigns,

  -- Financial KPIs
  (SELECT SUM(profit) FROM public.deals)                          AS total_deals_profit,
  (SELECT SUM(ABS(amount)) FROM public.expenses
    WHERE account_type NOT ILIKE '%income%')                      AS total_expenses,
  (SELECT COUNT(*) FROM public.deals)                             AS total_deals,

  -- Freshness
  GREATEST(
    (SELECT MAX(updated_at) FROM public.campaigns),
    (SELECT MAX(updated_at) FROM public.call_campaigns),
    (SELECT MAX(updated_at) FROM public.mail_campaigns),
    (SELECT MAX(updated_at) FROM public.deals),
    (SELECT MAX(updated_at) FROM public.expenses),
    (SELECT MAX("Created Time") FROM "DataAirtable"."DataKPI")
  ) AS last_updated;
```

### View 6: `v_agent_vs_pipeline`
Temporal cross-join between agent monthly performance and campaign pipeline for same month.
Add a clear comment: "NOTE: agents are not linked to specific campaigns. This join is purely temporal (same month/year). Use for trend correlation only."

```sql
CREATE OR REPLACE VIEW v_agent_vs_pipeline AS
SELECT
  a.agent_name,
  a.month,
  a.year,
  a.total_offers_sent,
  a.total_signed_contracts,
  a.avg_close_rate,
  a.total_hot_leads,

  -- Campaign results in same period (all channels)
  SUM(cp.leads)            AS pipeline_leads_same_month,
  SUM(cp.cost)             AS pipeline_cost_same_month,
  SUM(cp.contracts_closed) AS pipeline_contracts_closed,

  -- Derived: estimated cost per signed contract (temporal approximation)
  CASE
    WHEN a.total_signed_contracts > 0
    THEN ROUND(SUM(cp.cost) / a.total_signed_contracts, 2)
    ELSE NULL
  END AS est_cost_per_signed_contract

FROM v_agent_monthly a
LEFT JOIN v_channel_pipeline cp
  ON cp.year = a.year
  AND cp.month = TO_CHAR(a.month, 'Mon')
GROUP BY
  a.agent_name, a.month, a.year,
  a.total_offers_sent, a.total_signed_contracts,
  a.avg_close_rate, a.total_hot_leads;
```

After creating `views.sql`, **execute all views in the database** to confirm they are valid before proceeding.

---

## Step 2 — Add a DB Migration Runner

In `backend/config/db.js`, check if there's already a mechanism to run SQL files. If not, add a utility function at the bottom:

```js
// Run this once manually to create/update views:
// node -e "require('./config/db').runViewMigration()"
const fs = require('fs');
const path = require('path');

async function runViewMigration() {
  const sql = fs.readFileSync(path.join(__dirname, '../sql/views.sql'), 'utf8');
  // Split by CREATE OR REPLACE VIEW and run each block
  const statements = sql.split(/(?=CREATE OR REPLACE VIEW)/i).filter(s => s.trim());
  for (const stmt of statements) {
    try {
      await pool.query(stmt);
      const name = stmt.match(/VIEW\s+(\S+)/i)?.[1];
      console.log(`✓ View created: ${name}`);
    } catch (err) {
      console.error(`✗ Error:`, err.message);
    }
  }
  await pool.end();
}

module.exports.runViewMigration = runViewMigration;
```

Adapt this to match the exact export/connection pattern already in `db.js` — do NOT change how the pool is exported or configured.

---

## Step 3 — Refactor Existing Route Files

For each route file, the pattern is:
- **Keep** all existing routes (GET list, GET by ID, POST, PUT, DELETE)
- **Replace** the inline SQL in GET list/aggregate routes to query the corresponding view
- **Do not change** POST/PUT/DELETE routes — they still write directly to the base tables
- **Do not change** route paths or Express router setup

### `routes/campaigns.js`
- Find the GET route that returns list/aggregate of text campaigns
- Replace its SQL with: `SELECT * FROM v_channel_pipeline WHERE channel = 'SMS'`
- Add optional query params already supported: `?entity=`, `?year=`, `?month=`
- Keep any existing filter logic, just swap the table name to the view

### `routes/call_campaigns.js`
- Same pattern: replace aggregate queries with `SELECT * FROM v_channel_pipeline WHERE channel = 'Cold Call'`
- Keep existing CRUD routes untouched

### `routes/mail_campaigns.js`
- Replace aggregate queries with `SELECT * FROM v_channel_pipeline WHERE channel = 'Direct Mail'`
- Keep existing CRUD routes untouched

### `routes/deals.js`
- No view change needed for CRUD
- Add a new GET `/deals/summary` route that queries `v_financial_monthly` filtered by deals columns
- Keep all existing routes exactly as they are

### `routes/expenses.js`
- No view change needed for CRUD
- Add a new GET `/expenses/summary` route that queries `v_financial_monthly`
- Keep all existing routes exactly as they are

### `routes/summary.js`
This is the most important file to refactor. It likely has large inline aggregation queries.
- Replace the main dashboard aggregation query with `SELECT * FROM v_dashboard_overview`
- Replace any monthly trend queries with `SELECT * FROM v_financial_monthly WHERE ...`
- Replace any channel comparison queries with `SELECT channel, SUM(leads), SUM(cost) FROM v_channel_pipeline GROUP BY channel`
- Keep the route paths exactly the same — only the SQL changes

---

## Step 4 — Create New Route Files

### `backend/routes/datakpi.js`

New route file for agent KPI data. Register it in `server.js` as `/api/datakpi`.

Endpoints:
```
GET /api/datakpi/daily
  Query params: ?agent=, ?from=YYYY-MM-DD, ?to=YYYY-MM-DD
  Query: SELECT * FROM v_agent_daily WHERE ... ORDER BY activity_date DESC

GET /api/datakpi/monthly
  Query params: ?agent=, ?year=, ?month=
  Query: SELECT * FROM v_agent_monthly WHERE ... ORDER BY month DESC

GET /api/datakpi/agents
  Returns distinct agent names and their all-time totals
  Query: SELECT agent_name, SUM(total_signed_contracts), SUM(total_offers_sent),
         SUM(total_hot_leads) FROM v_agent_monthly GROUP BY agent_name ORDER BY SUM(total_signed_contracts) DESC

GET /api/datakpi/:id
  Returns single record from DataAirtable.DataKPI by ID
```

Use the same query pattern (pool.query style) as the existing route files.

### `backend/routes/crossview.js`

New route file for cross-data analysis. Register in `server.js` as `/api/crossview`.

Endpoints:
```
GET /api/crossview/overview
  Query: SELECT * FROM v_dashboard_overview

GET /api/crossview/agent-pipeline
  Query params: ?agent=, ?from=YYYY-MM, ?to=YYYY-MM
  Query: SELECT * FROM v_agent_vs_pipeline WHERE ... ORDER BY month DESC

GET /api/crossview/financial
  Query params: ?entity=, ?year=
  Query: SELECT * FROM v_financial_monthly WHERE ... ORDER BY year DESC, month DESC
```

---

## Step 5 — Register New Routes in `server.js`

Open `server.js` and add the two new route registrations following the exact same pattern used for existing routes:

```js
const datakpiRoutes  = require('./routes/datakpi');
const crossviewRoutes = require('./routes/crossview');

app.use('/api/datakpi',   datakpiRoutes);
app.use('/api/crossview', crossviewRoutes);
```

Do not change anything else in `server.js`.

---

## Step 6 — Update `frontend/src/services/api.js`

Open the existing file and ADD the following new functions at the bottom without modifying existing ones:

```js
// === DataKPI — Agent Performance ===
export const getAgentDaily    = (params) => api.get('/datakpi/daily',   { params });
export const getAgentMonthly  = (params) => api.get('/datakpi/monthly', { params });
export const getAgentList     = ()        => api.get('/datakpi/agents');

// === Cross-View — Combined Analysis ===
export const getDashboardOverview = (params) => api.get('/crossview/overview',        { params });
export const getAgentPipeline     = (params) => api.get('/crossview/agent-pipeline',  { params });
export const getFinancialMonthly  = (params) => api.get('/crossview/financial',       { params });
```

Adapt the syntax to match whatever style is already used in `api.js` (axios instance, fetch wrapper, etc).

---

## Step 7 — Update `SummaryDashboard.jsx`

Open the file and identify:
1. Where it fetches the main KPI card data → replace with `getDashboardOverview()`
2. Where it fetches monthly trend data → replace with `getFinancialMonthly()`
3. Where it fetches channel comparison data → replace with the channel pipeline endpoint

Add a new section to the dashboard (or replace a placeholder if one exists) that shows the agent performance cross-view using `getAgentPipeline()`. This should show a table or chart with: agent name, month, offers sent, signed contracts, close rate, pipeline leads same month, and estimated cost per signed contract.

Do not change the layout, styling, or any Tailwind classes. Only update the data fetching logic and add the new data section.

---

## Constraints & Rules

- **Never drop or rename existing route paths** — the frontend already calls them
- **Never modify** `DataTable.jsx`, `EditModal.jsx`, `FilterBar.jsx`, `ConfirmDialog.jsx`, `Pagination.jsx`, `formatters.js`
- **Never truncate** `DataAirtable.DataKPI` — it is append-only (daily inserts)
- **Always use `CREATE OR REPLACE VIEW`** — never DROP VIEW
- **Always handle `NULL` and division by zero** in view SQL
- **Match the coding style** of existing route files exactly — same error handling pattern, same response shape `{ data: [...], total: N }`
- If any existing route already queries a view or has good SQL, leave it alone and document what you found

---

## Final Checklist

Before finishing, verify:
- [ ] All 6 views exist in the database (`SELECT * FROM v_dashboard_overview` returns 1 row)
- [ ] `GET /api/crossview/overview` returns data
- [ ] `GET /api/datakpi/agents` returns the list of agents with totals
- [ ] `GET /api/datakpi/monthly?agent=Pedro Dev` returns monthly data for that agent
- [ ] `GET /api/crossview/agent-pipeline` returns rows with both agent and pipeline columns
- [ ] All existing routes still work exactly as before
- [ ] `server.js` registers all routes without errors on startup
- [ ] No `node_modules` or `.env` files were modified