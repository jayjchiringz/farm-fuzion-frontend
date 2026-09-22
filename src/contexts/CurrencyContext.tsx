// farm-fuzion-frontend/src/contexts/CurrencyContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { formatCurrency } from '../utils/format';

// Supported currencies with their details
export const SUPPORTED_CURRENCIES = [
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', region: 'Kenya' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', flag: '🇺🇬', region: 'Uganda' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', flag: '🇹🇿', region: 'Tanzania' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', region: 'United States' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', region: 'Europe' },
];

// Free currency API (no key required)
const CURRENCY_API = 'https://api.exchangerate-api.com/v4/latest/USD';

interface CurrencyContextType {
  selectedCurrency: string;
  currencies: typeof SUPPORTED_CURRENCIES;
  rates: Record<string, number>;
  setSelectedCurrency: (currency: string) => void;
  convertFromKES: (amountInKES: number) => number;  // Convert KES to selected currency
  convertToKES: (amount: number, fromCurrency: string) => number;  // Convert any currency to KES
  formatKES: (amountInKES: number) => string;  // Format KES amount in selected currency
  formatAmount: (amount: number, fromCurrency: string) => string;  // Legacy - specify source currency
  isLoading: boolean;
  lastUpdated: Date | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Default fallback rates (KES as base)
const DEFAULT_RATES = {
  KES: 1,
  USD: 0.0077,  // 1 KES = 0.0077 USD
  UGX: 28.7,    // 1 KES = 28.7 UGX
  TZS: 19.4,    // 1 KES = 19.4 TZS
  EUR: 0.0071,  // 1 KES = 0.0071 EUR
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved preference or default to KES
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    const saved = localStorage.getItem('preferredCurrency');
    return saved || 'KES';
  });
  
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load rates on mount
  useEffect(() => {
    loadRates();
  }, []);

  // Save preference when it changes
  useEffect(() => {
    localStorage.setItem('preferredCurrency', selectedCurrency);
  }, [selectedCurrency]);

  const loadRates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(CURRENCY_API);
      const data = await response.json();
      
      // Convert USD-based rates to KES-based rates
      // API gives rates relative to USD, so we need to convert
      const usdToKes = data.rates.KES || 130;
      
      const kesBasedRates: Record<string, number> = {
        KES: 1,
        USD: 1 / usdToKes,
        UGX: (data.rates.UGX || 3700) / usdToKes,
        TZS: (data.rates.TZS || 2500) / usdToKes,
        EUR: (data.rates.EUR || 0.92) / usdToKes,
      };
      
      setRates(kesBasedRates);
      setLastUpdated(new Date());
      console.log("✅ Currency rates loaded (KES-based):", kesBasedRates);
    } catch (error) {
      console.error('Error loading currency rates, using defaults:', error);
      // Keep using DEFAULT_RATES
    } finally {
      setIsLoading(false);
    }
  };

  // Convert KES to selected currency
  const convertFromKES = (amountInKES: number): number => {
    if (!amountInKES || isNaN(amountInKES)) return 0;
    if (selectedCurrency === 'KES') return amountInKES;
    
    try {
      const rate = rates[selectedCurrency] || 1;
      const converted = amountInKES * rate;
      return Math.round(converted * 100) / 100; // Round to 2 decimals
    } catch (error) {
      console.error('Error converting from KES:', error);
      return amountInKES;
    }
  };

  // Convert any currency to KES
  const convertToKES = (amount: number, fromCurrency: string): number => {
    if (!amount || isNaN(amount)) return 0;
    if (fromCurrency === 'KES') return amount;
    
    try {
      const rate = rates[fromCurrency] || 1;
      const inKES = amount / rate;
      return Math.round(inKES * 100) / 100;
    } catch (error) {
      console.error('Error converting to KES:', error);
      return amount;
    }
  };

  // Format KES amount in selected currency
  const formatKES = (amountInKES: number): string => {
    const converted = convertFromKES(amountInKES);
    return formatCurrency(converted, selectedCurrency);
  };

  // Legacy: format amount with source currency specified
  const formatAmount = (amount: number, fromCurrency: string = 'USD'): string => {
    const inKES = convertToKES(amount, fromCurrency);
    const converted = convertFromKES(inKES);
    return formatCurrency(converted, selectedCurrency);
  };

  return (
    <CurrencyContext.Provider value={{
      selectedCurrency,
      currencies: SUPPORTED_CURRENCIES,
      rates,
      setSelectedCurrency,
      convertFromKES,
      convertToKES,
      formatKES,
      formatAmount,
      isLoading,
      lastUpdated,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};
