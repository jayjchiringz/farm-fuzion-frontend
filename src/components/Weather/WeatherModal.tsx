// farm-fuzion-frontend/src/components/Weather/WeatherModal.tsx
import React, { useState, useEffect } from "react";
import { 
  X, Cloud, Sun, CloudRain, Wind, Droplets, 
  Calendar, TrendingUp, History, MapPin,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { weatherApi, WeatherData } from "../../services/weatherApi";

interface WeatherModalProps {
  farmerId: string;
  farmerLocation?: {
    county?: string;
    sub_county?: string;
    ward?: string;
    village?: string;
  };
  onClose: () => void;
}

type WeatherTab = "current" | "forecast" | "historical";

// Mock historical data (replace with actual API later)
const getMockHistoricalData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(month => ({
    month,
    rainfall: Math.floor(Math.random() * 150 + 20),
    temperature: Math.floor(Math.random() * 10 + 20),
    days: Math.floor(Math.random() * 10 + 15)
  }));
};

export default function WeatherModal({
  farmerId,
  farmerLocation,
  onClose
}: WeatherModalProps) {
  const [activeTab, setActiveTab] = useState<WeatherTab>("current");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("nairobi");
  const [historicalData] = useState(getMockHistoricalData());

  // Regions for quick select (same as before)
  const regions = [
    { id: 'nairobi', name: 'Nairobi' },
    { id: 'nakuru', name: 'Nakuru' },
    { id: 'eldoret', name: 'Eldoret' },
    { id: 'kisumu', name: 'Kisumu' },
    { id: 'mombasa', name: 'Mombasa' },
    { id: 'kitale', name: 'Kitale' },
    { id: 'meru', name: 'Meru' },
    { id: 'machakos', name: 'Machakos' },
  ];

  useEffect(() => {
    fetchWeather(selectedRegion);
  }, [selectedRegion]);

  const fetchWeather = async (region: string) => {
    setLoading(true);
    try {
      const data = await weatherApi.getRegionWeather(region as any);
      setWeatherData(data);
    } catch (error) {
      console.error("Error fetching weather:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get farmer's location display
  const farmerLocationDisplay = farmerLocation ? 
    [farmerLocation.village, farmerLocation.ward, farmerLocation.sub_county, farmerLocation.county]
      .filter(Boolean).join(', ') : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Cloud size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Weather Intelligence</h2>
                <p className="text-white/80 text-sm">
                  Plan your farm activities with accurate weather data
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Farmer's location badge */}
          {farmerLocationDisplay && (
            <div className="mt-3 flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5 text-sm w-fit">
              <MapPin size={14} />
              <span>Your farm: {farmerLocationDisplay}</span>
            </div>
          )}
        </div>

        {/* Region Selector */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <label className="block text-sm font-medium mb-2">Select Region</label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full md:w-64 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          >
            {regions.map(region => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 pt-4">
          <button
            onClick={() => setActiveTab("current")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "current"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Cloud size={16} />
            Current Weather
          </button>
          <button
            onClick={() => setActiveTab("forecast")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "forecast"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Calendar size={16} />
            7-Day Forecast
          </button>
          <button
            onClick={() => setActiveTab("historical")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "historical"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <History size={16} />
            Historical Patterns
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent"></div>
            </div>
          ) : (
            <>
              {/* Current Weather Tab */}
              {activeTab === "current" && weatherData && (
                <div className="space-y-6">
                  {/* Current conditions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl">
                      <div className="flex items-center gap-4">
                        <span className="text-6xl">{weatherData.conditionIcon}</span>
                        <div>
                          <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
                            {weatherData.temperature}°C
                          </div>
                          <div className="text-lg text-gray-600 dark:text-gray-300">
                            {weatherData.condition}
                          </div>
                          <div className="text-sm text-gray-500">
                            Feels like {weatherData.feelsLike}°C
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                          <Droplets size={16} />
                          <span className="text-xs">Humidity</span>
                        </div>
                        <div className="text-2xl font-bold">{weatherData.humidity}%</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                          <Wind size={16} />
                          <span className="text-xs">Wind</span>
                        </div>
                        <div className="text-2xl font-bold">{weatherData.windSpeed} km/h</div>
                        <div className="text-xs text-gray-500">{weatherData.windDirection}</div>
                      </div>
                    </div>
                  </div>

                  {/* Farming recommendations */}
                  <div className="bg-blue-600/10 p-6 rounded-xl">
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <TrendingUp size={18} className="text-blue-600" />
                      Today's Farming Recommendations
                    </h4>
                    <ul className="space-y-2 text-sm">
                      {weatherData.condition.includes('Rain') ? (
                        <>
                          <li className="flex items-center gap-2">🌱 Perfect for planting - rain will help germination</li>
                          <li className="flex items-center gap-2">🚜 Avoid spraying chemicals - rain will wash them off</li>
                          <li className="flex items-center gap-2">💧 Check drainage systems to prevent waterlogging</li>
                        </>
                      ) : weatherData.temperature > 28 ? (
                        <>
                          <li className="flex items-center gap-2">💧 Increase irrigation - high heat today</li>
                          <li className="flex items-center gap-2">🌾 Apply mulch to retain soil moisture</li>
                          <li className="flex items-center gap-2">☀️ Provide shade for sensitive seedlings</li>
                        </>
                      ) : weatherData.windSpeed > 20 ? (
                        <>
                          <li className="flex items-center gap-2">🌾 Check support for tall crops (maize, bananas)</li>
                          <li className="flex items-center gap-2">🚜 Delay spraying until winds calm down</li>
                          <li className="flex items-center gap-2">🏡 Secure greenhouse covers</li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-center gap-2">🌱 Ideal conditions for general farm work</li>
                          <li className="flex items-center gap-2">🚜 Good day for spraying fertilizers</li>
                          <li className="flex items-center gap-2">🌾 Perfect for harvesting dry produce</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Forecast Tab */}
              {activeTab === "forecast" && weatherData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {weatherData.forecast.map((day, idx) => (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-center">
                        <div className="text-sm font-medium mb-2">{day.day}</div>
                        <span className="text-4xl mb-2 block">{day.conditionIcon}</span>
                        <div className="flex justify-center gap-2 text-sm">
                          <span className="font-bold text-blue-600">{day.maxTemp}°</span>
                          <span className="text-gray-500">{day.minTemp}°</span>
                        </div>
                        {day.precipitation > 0 && (
                          <div className="text-xs text-blue-600 mt-2 flex items-center justify-center gap-1">
                            <CloudRain size={12} />
                            {day.precipitation}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <Calendar size={16} className="inline mr-2" />
                      Best planting days: {
                        weatherData.forecast
                          .filter(d => d.condition.includes('Rain') || d.precipitation > 30)
                          .map(d => d.day)
                          .join(', ') || 'No significant rain expected'
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Historical Patterns Tab */}
              {activeTab === "historical" && (
                <div className="space-y-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Average weather patterns over the last 5 years
                  </p>

                  {/* Rainfall chart */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <CloudRain size={16} className="text-blue-600" />
                      Average Monthly Rainfall (mm)
                    </h4>
                    <div className="h-40 flex items-end gap-2">
                      {historicalData.map((month, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-blue-200 dark:bg-blue-900/30 rounded-t relative group">
                            <div 
                              className="w-full bg-blue-600 rounded-t transition-all"
                              style={{ height: `${(month.rainfall / 200) * 100}%` }}
                            >
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                                {month.rainfall}mm
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">{month.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Temperature trends */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Sun size={16} className="text-yellow-600" />
                      Average Temperature Range (°C)
                    </h4>
                    <div className="space-y-2">
                      {historicalData.slice(0, 6).map((month, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-10 text-xs">{month.month}</span>
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-400 to-red-400"
                              style={{ width: `${(month.temperature / 35) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs">{month.temperature}°C</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Growing season advice */}
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">🌱 Planning Insights</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Based on historical patterns, the long rains typically start in March. 
                      Consider preparing your land in February for the main planting season.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
