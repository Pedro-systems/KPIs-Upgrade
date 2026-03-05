/**
 * Utility functions for data formatting
 */

import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata valor monetário
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = parseFloat(value);
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Formata percentual
 */
export const formatPercent = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = parseFloat(value);
  if (isNaN(num)) return '-';
  return `${num.toFixed(2)}%`;
};

/**
 * Formata número decimal
 */
export const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = parseFloat(value);
  if (isNaN(num)) return '-';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Formata data para exibição (DD/MM/YYYY)
 */
export const formatDate = (value) => {
  if (!value) return '-';
  try {
    const date = typeof value === 'string' ? parseISO(value) : value;
    if (!isValid(date)) return '-';
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '-';
  }
};

/**
 * Formata data para input (YYYY-MM-DD)
 */
export const formatDateForInput = (value) => {
  if (!value) return '';
  try {
    const date = typeof value === 'string' ? parseISO(value) : value;
    if (!isValid(date)) return '';
    return format(date, 'yyyy-MM-dd');
  } catch {
    return '';
  }
};

/**
 * Determina a classe CSS para valores numéricos (positivo/negativo)
 */
export const getValueClass = (value) => {
  if (value === null || value === undefined || value === '') return 'value-neutral';
  const num = parseFloat(value);
  if (isNaN(num)) return 'value-neutral';
  if (num > 0) return 'value-positive';
  if (num < 0) return 'value-negative';
  return 'value-neutral';
};

/**
 * Formata booleano para exibição
 */
export const formatBoolean = (value) => {
  if (value === null || value === undefined) return '-';
  return value ? 'Yes' : 'No';
};

/**
 * Trunca texto longo
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Debounce function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Deep clone an object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Remove empty fields from an object
 */
export const cleanObject = (obj) => {
  const cleaned = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = value;
    }
  });
  return cleaned;
};
