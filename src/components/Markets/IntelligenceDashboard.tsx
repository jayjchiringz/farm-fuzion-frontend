import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Calendar } from 'lucide-react';

interface IntelligenceDashboardProps {
  farmerData: {
    location: string;
    inventory: Array<{
      product: string;
      quantity: number;
      harvestDate: Date;
    }>;
  };
}

const IntelligenceDashboard: React.FC<IntelligenceDashboardProps> = ({ farmerData }) => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [marketInsights, setMarketInsights] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntelligenceData();
  }, [farmerData]);

  const fetchIntelligenceData = async () => {
    try {
      // Fetch intelligent recommendations
      const recResponse = await fetch('/api/market-prices/intelligent-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(farmerData)
      });
      const recData = await recResponse.json();
      setRecommendations(recData.recommendations);
      setMarketInsights(recData.marketInsights);

      // Fetch predictions for each product
      const predictionPromises = farmerData.inventory.map(item =>
        fetch(`/api/market-prices/predict/${encodeURIComponent(item.product)}?days=30`)
          .then(res => res.json())
      );
      const predictionsData = await Promise.all(predictionPromises);
      setPredictions(predictionsData);
    } catch (error) {
      console.error('Failed to fetch intelligence data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading intelligence dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* Market Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Market Risk Level</h3>
            <AlertTriangle className={`text-${marketInsights.riskLevel === 'HIGH' ? 'red' : marketInsights.riskLevel === 'MEDIUM' ? 'yellow' : 'green'}-500`} />
          </div>
          <p className={`text-2xl font-bold text-${marketInsights.riskLevel === 'HIGH' ? 'red' : marketInsights.riskLevel === 'MEDIUM' ? 'yellow' : 'green'}-600`}>
            {marketInsights.riskLevel}
          </p>
          <p className="text-sm text-gray-600">Based on volatility analysis</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Best Opportunity</h3>
            <TrendingUp className="text-green-500" />
          </div>
          <p className="text-2xl font-bold">{marketInsights.bestPerformingProduct}</p>
          <p className="text-sm text-gray-600">Highest profit margin this month</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Market Trend</h3>
            {marketInsights.overallTrend?.includes('up') ? 
              <TrendingUp className="text-green-500" /> : 
              <TrendingDown className="text-red-500" />
            }
          </div>
          <p className="text-xl font-bold">{marketInsights.overallTrend}</p>
          <p className="text-sm text-gray-600">30-day outlook</p>
        </div>
      </div>

      {/* Product Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">📈 Intelligent Recommendations</h2>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{rec.product}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      rec.recommendedAction === 'SELL' ? 'bg-green-100 text-green-800' :
                      rec.recommendedAction === 'BUY' ? 'bg-blue-100 text-blue-800' :
                      rec.recommendedAction === 'HOLD' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {rec.recommendedAction} ({rec.confidenceScore}% confidence)
                    </span>
                    <DollarSign size={16} />
                    <span>KES {rec.currentPrices.farmgate?.toLocaleString()}</span>
                  </div>
                </div>
                <button className="bg-brand-green text-white px-4 py-2 rounded hover:bg-green-700">
                  View Details
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600">Expected Price (30d)</p>
                  <p className="font-bold">KES {rec.priceProjection30d.expected?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Optimal Sell Date</p>
                  <p className="font-bold flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(rec.optimalTiming.bestSellDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price Range</p>
                  <p className="font-bold">
                    KES {rec.priceProjection30d.min?.toLocaleString()} - {rec.priceProjection30d.max?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Alternative</p>
                  <p className="font-bold text-blue-600">
                    {rec.alternativeProducts[0]?.product || 'None'}
                  </p>
                </div>
              </div>

              {rec.riskFactors.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-semibold text-red-600">⚠️ Risk Factors:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {rec.riskFactors.map((risk: any, i: number) => (
                      <span key={i} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                        {risk.factor} ({risk.impact})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Price Predictions Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">🔮 30-Day Price Forecast</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={predictions[0]?.predictions || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis label={{ value: 'KES', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Predicted Price']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="predictedPrice" 
                name="Predicted Price"
                stroke="#4CAF50" 
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="confidenceInterval.upper" 
                name="Upper Bound"
                stroke="#82ca9d" 
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <Line 
                type="monotone" 
                dataKey="confidenceInterval.lower" 
                name="Lower Bound"
                stroke="#82ca9d" 
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Market Timing Insights */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">⏰ Market Timing Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold mb-3">Best Selling Months</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={generateMonthlyData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="premium" name="Price Premium %" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="font-bold mb-3">Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Low Risk', value: 40, color: '#4CAF50' },
                    { name: 'Medium Risk', value: 35, color: '#FFC107' },
                    { name: 'High Risk', value: 25, color: '#F44336' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Low Risk', value: 40, color: '#4CAF50' },
                    { name: 'Medium Risk', value: 35, color: '#FFC107' },
                    { name: 'High Risk', value: 25, color: '#F44336' }
                  ].map((entry: { color: string | undefined; }, index: any) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const generateMonthlyData = () => {
  return [
    { month: 'Jan', premium: 15 },
    { month: 'Feb', premium: 20 },
    { month: 'Mar', premium: 25 },
    { month: 'Apr', premium: 18 },
    { month: 'May', premium: 12 },
    { month: 'Jun', premium: 8 },
    { month: 'Jul', premium: 5 },
    { month: 'Aug', premium: 10 },
    { month: 'Sep', premium: 22 },
    { month: 'Oct', premium: 28 },
    { month: 'Nov', premium: 30 },
    { month: 'Dec', premium: 25 }
  ];
};

export default IntelligenceDashboard;