-- Drop dependent views first
DROP VIEW IF EXISTS v_agent_vs_pipeline CASCADE;
DROP VIEW IF EXISTS v_agent_monthly CASCADE;
DROP VIEW IF EXISTS v_agent_weekly CASCADE;

-- Note: Run views.sql after this to recreate the views
