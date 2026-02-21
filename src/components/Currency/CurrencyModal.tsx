// farm-fuzion-frontend/src/components/Currency/CurrencyModal.tsx
import React, { useState } from 'react';
import { X, Check, RefreshCw, Globe, Clock } from 'lucide-react';
import { useCurrency, SUPPORTED_CURRENCIES } from '../../contexts/CurrencyContext';

interface CurrencyModalProps {
  onClose: () => void;
}

export default function CurrencyModal({ onClose }: CurrencyModalProps) {
  const { 
    selectedCurrency, 
    setSelectedCurrency, 
    rates, 
    isLoading, 
    lastUpdated,
    formatAmount 
  } = useCurrency();
  
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredCurrency, setHoveredCurrency] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh (context will auto-refresh)
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSelect = (code: string) => {
    setSelectedCurrency(code);
    onClose();
  };

  // Sample amounts to show conversion
  const sampleAmounts = [100, 1000, 10000];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Globe size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Currency Settings</h2>
                <p className="text-white/80 text-sm">Choose your preferred currency</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Status bar */}
          <div className="flex justify-between items-center mb-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Clock size={14} />
              <span>
                {lastUpdated 
                  ? `Updated: ${lastUpdated.toLocaleTimeString()}`
                  : 'Rates loading...'}
              </span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
              className="flex items-center gap-1 text-brand-green hover:text-green-700 disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Currency grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {SUPPORTED_CURRENCIES.map((currency) => {
              const isSelected = selectedCurrency === currency.code;
              const isHovered = hoveredCurrency === currency.code;
              const rate = rates[currency.code]?.toFixed(2) || '...';
              
              return (
                <button
                  key={currency.code}
                  onClick={() => handleSelect(currency.code)}
                  onMouseEnter={() => setHoveredCurrency(currency.code)}
                  onMouseLeave={() => setHoveredCurrency(null)}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-brand-green bg-brand-green/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-brand-green/50 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{currency.flag}</span>
                    <div className="flex-1 text-left">
                      <div className="font-bold">{currency.name}</div>
                      <div className="text-sm text-gray-500">{currency.code}</div>
                      <div className="text-xs text-gray-400 mt-1">{currency.region}</div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check size={16} className="text-brand-green" />
                      </div>
                    )}
                  </div>
                  
                  {/* Rate info */}
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">1 USD =</span>
                      <span className="font-mono font-medium">
                        {currency.symbol} {rate}
                      </span>
                    </div>
                  </div>

                  {/* Sample conversions on hover */}
                  {isHovered && !isSelected && (
                    <div className="absolute left-0 right-0 mt-2 p-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 z-10">
                      <p className="text-xs font-medium mb-1">Sample conversions:</p>
                      {sampleAmounts.map(amount => (
                        <div key={amount} className="flex justify-between text-xs py-0.5">
                          <span>{currency.symbol} {amount}</span>
                          <span className="text-gray-500">
                            ≈ {formatAmount(amount, currency.code)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Info note */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
              <Globe size={16} className="mt-0.5 flex-shrink-0" />
              <span>
                Your currency preference will apply to all prices across the platform. 
                Exchange rates are updated in real-time from free public APIs.
              </span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
