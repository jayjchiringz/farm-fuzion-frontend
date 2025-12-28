// src/utils/dashboard.ts
export const formatPriceChange = (change: number) => {
  const absChange = Math.abs(change);
  if (absChange > 10) return 'HIGH';
  if (absChange > 5) return 'MEDIUM';
  return 'LOW';
};

export const getTrendColor = (trend: 'UP' | 'DOWN' | 'STABLE') => {
  switch(trend) {
    case 'UP': return 'text-green-600 bg-green-50';
    case 'DOWN': return 'text-red-600 bg-red-50';
    default: return 'text-yellow-600 bg-yellow-50';
  }
};
