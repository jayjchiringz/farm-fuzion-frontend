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
  convertAmount: (amount: number, fromCurrency?: string) => number;
  formatAmount: (amount: number, fromCurrency?: string) => string;
  isLoading: boolean;
  lastUpdated: Date | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved preference or default to KES
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    const saved = localStorage.getItem('preferredCurrency');
    return saved || 'KES';
  });
  
  const [rates, setRates] = useState<Record<string, number>>({
    KES: 130, // Default approximate rates
    UGX: 3700,
    TZS: 2500,
    USD: 1,
    EUR: 0.92,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load rates on mount and when currency changes
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
      setRates(data.rates);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading currency rates:', error);
      // Keep using default rates
    } finally {
      setIsLoading(false);
    }
  };

  // Convert amount from source currency to selected currency
  const convertAmount = (amount: number, fromCurrency: string = 'USD'): number => {
    if (!amount || isNaN(amount)) return 0;
    if (fromCurrency === selectedCurrency) return amount;
    
    try {
      // Convert to USD first (base), then to target
      const inUSD = fromCurrency === 'USD' ? amount : amount / (rates[fromCurrency] || 1);
      const converted = selectedCurrency === 'USD' ? inUSD : inUSD * (rates[selectedCurrency] || 1);
      
      return Math.round(converted * 100) / 100; // Round to 2 decimals
    } catch (error) {
      console.error('Error converting amount:', error);
      return amount;
    }
  };

  // Format amount using your existing formatter
  const formatAmount = (amount: number, fromCurrency: string = 'USD'): string => {
    const converted = convertAmount(amount, fromCurrency);
    return formatCurrency(converted, selectedCurrency);
  };

  return (
    <CurrencyContext.Provider value={{
      selectedCurrency,
      currencies: SUPPORTED_CURRENCIES,
      rates,
      setSelectedCurrency,
      convertAmount,
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
