# Divergências entre CSV e Sistema

## Problema Identificado

Os valores de **Average Cost Per Lead**, **Average Cost Per Contract** e **Average Margin Per Contract** no sistema não batiam com os valores do CSV.

---

## Causa Raiz

### Fórmula do CSV (Correta)
O CSV usa `AVERAGEIF()` do Excel, que calcula a **média dos valores por linha**:

```
=AVERAGEIF($L$5:$L$2151,C$1,$Z$5:$Z$2151)
```

Isso significa: para cada linha de campanha, o Excel já tem o valor calculado de "cost per lead" daquela campanha específica, e depois faz a **média de todos esses valores**.

### Fórmula do Sistema (Incorreta)
O sistema estava calculando **Total / Total**:

```javascript
// ERRADO - Ratio de totais
avgCostPerLead = totalSpent / totalLeads
// Exemplo: $135,264 / 3,002 = $45.06
```

### Por que são diferentes?

Matematicamente, **média de ratios ≠ ratio de somas**.

| Campanha | Custo | Leads | Cost/Lead |
|----------|-------|-------|-----------|
| A        | $100  | 10    | $10       |
| B        | $200  | 5     | $40       |

- **Média dos ratios (CSV):** ($10 + $40) / 2 = **$25**
- **Ratio das somas (Sistema antigo):** $300 / 15 = **$20**

---

## Valores Comparativos (MAIL)

| Métrica | CSV | Sistema (antes) | Diferença |
|---------|-----|-----------------|-----------|
| Avg Cost Per Lead | $77.74 | $45.06 | +72% |
| Por entidade (LD) | $51 | — | — |
| Por entidade (CN) | $123 | — | — |

---

## Correção Aplicada

### Arquivos Modificados

1. **backend/routes/mail_campaigns.js**
2. **backend/routes/call_campaigns.js**
3. **backend/routes/summary.js**

### Mudança nas Queries SQL

**Antes:**
```sql
SELECT 
  COALESCE(SUM(campaign_cost), 0) as total_spent,
  COALESCE(SUM(leads_generated), 0) as total_leads
FROM mail_campaigns
-- Depois calculava: total_spent / total_leads
```

**Depois:**
```sql
SELECT 
  COALESCE(SUM(campaign_cost), 0) as total_spent,
  COALESCE(SUM(leads_generated), 0) as total_leads,
  COALESCE(AVG(average_cost_per_lead), 0) as avg_cost_per_lead,
  COALESCE(AVG(average_cost_per_contract), 0) as avg_cost_per_contract,
  COALESCE(AVG(average_margin_per_contract), 0) as avg_margin_per_contract
FROM mail_campaigns
-- Agora usa direto o AVG das colunas já calculadas por linha
```

### Mudança nas Funções Helper

**Antes:**
```javascript
function calculateDerivedKpis(row) {
  // Calculava do total
  avgCostPerLead: totalLeads > 0 ? totalSpent / totalLeads : 0,
  avgCostPerContract: totalContractsClosed > 0 ? totalSpent / totalContractsClosed : 0,
  avgMarginPerContract: totalContractsClosed > 0 ? totalMargin / totalContractsClosed : 0,
}
```

**Depois:**
```javascript
function calculateDerivedKpis(row) {
  // Usa AVG da query (igual ao AVERAGEIF do CSV)
  const avgCostPerLead = parseFloat(row.avg_cost_per_lead) || 0;
  const avgCostPerContract = parseFloat(row.avg_cost_per_contract) || 0;
  const avgMarginPerContract = parseFloat(row.avg_margin_per_contract) || 0;
  
  return {
    avgCostPerLead,
    avgCostPerContract,
    avgMarginPerContract,
    // ... outros campos
  };
}
```

---

## Métricas que NÃO foram afetadas

Estas métricas usam corretamente Total/Total e batem com o CSV:

- **Response Rate** = Total Leads / Total Mailers Sent
- **Lead to Contract Sent Rate** = Total Contracts Sent / Total Leads  
- **Contract Sent to Closed Rate** = Total Contracts Closed / Total Contracts Sent
- **ROAS** = Total Margin / Total Spent

---

## Resumo

| Tipo de Cálculo | Usado Para |
|-----------------|------------|
| `SUM(a) / SUM(b)` | Taxas de conversão (Response Rate, Close Rate, ROAS) |
| `AVG(coluna)` | Médias de custo/margem por unidade (Cost Per Lead, Cost Per Contract, Margin Per Contract) |

A diferença é que **taxas** são calculadas sobre totais, mas **custos médios por unidade** devem ser a média das unidades individuais.
