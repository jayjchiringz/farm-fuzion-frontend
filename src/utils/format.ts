// src/utils/format.ts
export const formatCurrency = (amount: number | null, currency: string = 'KES'): string => {
  if (amount === null || amount === undefined) return 'N/A';
  
  const formatter = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  try {
    return formatter.format(amount);
  } catch (error) {
    // Fallback for unsupported currencies
    const symbols: Record<string, string> = {
      'KES': 'Ksh ',
      'USD': '$',
      'UGX': 'USh ',
      'TZS': 'TSh ',
      'EUR': '€',
    };
    
    const symbol = symbols[currency] || currency;
    return `${symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};

// Keep backward compatibility
export const formatCurrencyKES = (amount: number | null): string => 
  formatCurrency(amount, 'KES');