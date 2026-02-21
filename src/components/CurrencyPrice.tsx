// farm-fuzion-frontend/src/components/CurrencyPrice.tsx
import React from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

interface CurrencyPriceProps {
  amount: number;
  fromCurrency?: string; // Original currency (default 'USD')
  className?: string;
  showApprox?: boolean;
}

export const CurrencyPrice: React.FC<CurrencyPriceProps> = ({
  amount,
  fromCurrency = 'USD',
  className = '',
  showApprox = false,
}) => {
  const { formatAmount, selectedCurrency, isLoading } = useCurrency();

  if (isLoading) {
    return <span className={className}>...</span>;
  }

  const formatted = formatAmount(amount, fromCurrency);
  
  return (
    <span className={className} title={`Original: ${amount} ${fromCurrency}`}>
      {showApprox && selectedCurrency !== fromCurrency && '≈ '}
      {formatted}
    </span>
  );
};

// Specialized version for KES amounts (most common in your app)
export const KESPrice: React.FC<Omit<CurrencyPriceProps, 'fromCurrency'>> = (props) => (
  <CurrencyPrice {...props} fromCurrency="KES" />
);
