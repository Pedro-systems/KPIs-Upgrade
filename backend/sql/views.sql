/**
 * PostgreSQL Views for KPI Dashboard
 * Source of truth for all cross-data views
 * Execute this file to create/update all views
 */

-- ============================================
-- VIEW 1: Agent Daily Activity
-- Clean view of agent KPIs with snake_case aliases
-- ============================================
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

-- ============================================
-- VIEW 2: Agent Weekly Aggregates
-- Aggregates agent KPIs by agent + week
-- ============================================
CREATE OR REPLACE VIEW v_agent_weekly AS
SELECT
  agent_name,
  DATE_TRUNC('week', activity_date) AS week_start,
  EXTRACT(YEAR FROM activity_date)  AS year,
  EXTRACT(WEEK FROM activity_date)  AS week_number,
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
  ROUND(AVG(NULLIF(sms_lead_rate, 0)), 4)  AS avg_sms_lead_rate,
  MIN(activity_date)                AS week_first_day,
  MAX(activity_date)                AS week_last_day,
  COUNT(DISTINCT activity_date)     AS days_active
FROM v_agent_daily
GROUP BY agent_name, DATE_TRUNC('week', activity_date), EXTRACT(YEAR FROM activity_date), EXTRACT(WEEK FROM activity_date);

-- ============================================
-- VIEW 3: Agent Monthly Aggregates
-- Aggregates agent KPIs by agent + month
-- ============================================
CREATE OR REPLACE VIEW v_agent_monthly AS
SELECT
  agent_name,
  activity_month                    AS month,
  EXTRACT(YEAR FROM activity_month) AS year,
  TO_CHAR(activity_month, 'Mon')    AS month_name,
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
  ROUND(AVG(NULLIF(sms_lead_rate, 0)), 4)  AS avg_sms_lead_rate,
  MIN(activity_date)                AS month_first_day,
  MAX(activity_date)                AS month_last_day,
  COUNT(DISTINCT activity_date)     AS days_active
FROM v_agent_daily
GROUP BY agent_name, activity_month;

-- ============================================
-- VIEW 4: Channel Pipeline (Unified)
-- UNION ALL of 3 campaign tables into one normalized schema
-- ============================================
CREATE OR REPLACE VIEW v_channel_pipeline AS

-- SMS Campaigns
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

-- Cold Call Campaigns
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

-- Direct Mail Campaigns
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

-- ============================================
-- VIEW 5: Financial Monthly Summary
-- Join expenses with deals profit, grouped by month/year/entity
-- ============================================
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

-- ============================================
-- VIEW 6: Dashboard Overview
-- Single-row summary for KPI cards at the top of dashboard
-- ============================================
CREATE OR REPLACE VIEW v_dashboard_overview AS
SELECT
  -- Agent KPIs
  (SELECT COALESCE(SUM("Signed Contracts"), 0) FROM "DataAirtable"."DataKPI")  AS total_signed_contracts,
  (SELECT COALESCE(SUM("Offers Sent"), 0)      FROM "DataAirtable"."DataKPI")  AS total_offers_sent,
  (SELECT COALESCE(SUM("Hot Leads"), 0)        FROM "DataAirtable"."DataKPI")  AS total_hot_leads,
  (SELECT COUNT(DISTINCT "Name")  FROM "DataAirtable"."DataKPI")  AS total_agents,

  -- Pipeline KPIs (all channels combined)
  (SELECT COALESCE(SUM(leads), 0) FROM v_channel_pipeline)                     AS total_leads_all_channels,
  (SELECT COALESCE(SUM(cost), 0)  FROM v_channel_pipeline)                     AS total_campaign_spend,
  (SELECT COUNT(*)   FROM v_channel_pipeline)                     AS total_campaigns,

  -- Financial KPIs
  (SELECT COALESCE(SUM(profit), 0) FROM public.deals)                          AS total_deals_profit,
  (SELECT COALESCE(SUM(ABS(amount)), 0) FROM public.expenses
    WHERE account_type NOT ILIKE '%income%')                      AS total_expenses,
  (SELECT COUNT(*) FROM public.deals)                             AS total_deals,

  -- Freshness
  GREATEST(
    (SELECT COALESCE(MAX(updated_at), '1970-01-01'::timestamp) FROM public.campaigns),
    (SELECT COALESCE(MAX(updated_at), '1970-01-01'::timestamp) FROM public.call_campaigns),
    (SELECT COALESCE(MAX(updated_at), '1970-01-01'::timestamp) FROM public.mail_campaigns),
    (SELECT COALESCE(MAX(updated_at), '1970-01-01'::timestamp) FROM public.deals),
    (SELECT COALESCE(MAX(updated_at), '1970-01-01'::timestamp) FROM public.expenses),
    (SELECT COALESCE(MAX("Created Time"), '1970-01-01'::timestamp) FROM "DataAirtable"."DataKPI")
  ) AS last_updated;

-- ============================================
-- VIEW 7: Agent vs Pipeline (Temporal Cross-Join)
-- NOTE: Agents are NOT linked to specific campaigns
-- This join is purely temporal (same month/year)
-- Use for trend correlation only, NOT attribution
-- ============================================
CREATE OR REPLACE VIEW v_agent_vs_pipeline AS
SELECT
  a.agent_name,
  a.month,
  a.year,
  a.month_name,
  a.total_offers_sent,
  a.total_signed_contracts,
  a.avg_close_rate,
  a.total_hot_leads,
  a.total_cold_calls,
  a.total_sms_sent,
  a.days_active,

  -- Campaign results in same period (all channels)
  COALESCE(SUM(cp.leads), 0)            AS pipeline_leads_same_month,
  COALESCE(SUM(cp.cost), 0)             AS pipeline_cost_same_month,
  COALESCE(SUM(cp.contracts_closed), 0) AS pipeline_contracts_closed,
  COALESCE(COUNT(cp.channel), 0)        AS pipeline_campaigns_count,

  -- Derived: estimated cost per signed contract (temporal approximation)
  CASE
    WHEN a.total_signed_contracts > 0
    THEN ROUND(SUM(cp.cost) / a.total_signed_contracts, 2)
    ELSE NULL
  END AS est_cost_per_signed_contract,

  -- ROI approximation
  CASE
    WHEN SUM(cp.cost) > 0 AND a.total_signed_contracts > 0
    THEN ROUND((a.total_signed_contracts * 30000 - SUM(cp.cost)) / NULLIF(SUM(cp.cost), 0) * 100, 2)
    ELSE NULL
  END AS est_roi_percent

FROM v_agent_monthly a
LEFT JOIN v_channel_pipeline cp
  ON cp.year = a.year
  AND cp.month = a.month_name
GROUP BY
  a.agent_name, a.month, a.year, a.month_name,
  a.total_offers_sent, a.total_signed_contracts,
  a.avg_close_rate, a.total_hot_leads,
  a.total_cold_calls, a.total_sms_sent, a.days_active;
