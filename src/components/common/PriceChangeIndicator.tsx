// src/components/common/PriceChangeIndicator.tsx
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceChangeIndicatorProps {
  change: number;
  showIcon?: boolean;
  animate?: boolean;
  className?: string;
}

export const PriceChangeIndicator: React.FC<PriceChangeIndicatorProps> = ({
  change,
  showIcon = true,
  animate = true,
  className = '',
}) => {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isZero = change === 0;
  
  const baseClasses = `inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
    animate && (isPositive || isNegative) ? 'animate-pulse-slow' : ''
  } ${className}`;

  if (isPositive) {
    return (
      <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`}>
        {showIcon && <TrendingUp size={14} />}
        +{change.toFixed(1)}%
      </span>
    );
  }

  if (isNegative) {
    return (
      <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`}>
        {showIcon && <TrendingDown size={14} />}
        {change.toFixed(1)}%
      </span>
    );
  }

  return (
    <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300`}>
      {showIcon && <Minus size={14} />}
      Stable
    </span>
  );
};
