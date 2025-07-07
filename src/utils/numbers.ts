// utils/numbers.ts
export const safeNumber = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const parseNumberInput = (value: string): number => {
  if (value === '' || value === null || value === undefined) {
    return 0;
  }
  
  // Remplacer les virgules par des points pour la notation décimale
  const normalizedValue = value.replace(',', '.');
  const parsed = parseFloat(normalizedValue);
  
  return isNaN(parsed) ? 0 : parsed;
};

export const formatNumber = (value: number, options?: {
  decimals?: number;
  locale?: string;
}): string => {
  const { decimals = 0, locale = 'fr-FR' } = options || {};
  
  if (isNaN(value)) {
    return '0';
  }
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatCurrency = (value: number, currency: string = 'MAD'): string => {
  if (isNaN(value)) {
    return '0,00 MAD';
  }
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
  }).format(value);
};

export const parseToInteger = (value: any): number => {
  const parsed = parseInt(value?.toString() || '0', 10);
  return isNaN(parsed) ? 0 : parsed;
};

export const isValidNumber = (value: any): boolean => {
  return !isNaN(value) && !isNaN(parseFloat(value));
};