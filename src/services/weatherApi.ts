// farm-fuzion-frontend/src/services/weatherApi.ts

export interface WeatherData {
  conditionIcon: string;
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  condition: string;
  conditionCode: number;
  uvIndex?: number;
  visibility?: number;
  pressure?: number;
  sunrise?: string;
  sunset?: string;
  forecast: WeatherForecast[];
}

export interface WeatherForecast {
  conditionIcon: string;
  date: string;
  day: string;
  maxTemp: number;
  minTemp: number;
  condition: string;
  conditionCode: number;
  precipitation: number;
  windSpeed: number;
}

// Kenya's major agricultural regions with coordinates
const KENYA_REGIONS = {
  nairobi: { lat: -1.286389, lon: 36.817223, name: "Nairobi" },
  nakuru: { lat: -0.303099, lon: 36.080026, name: "Nakuru" },
  eldoret: { lat: 0.514277, lon: 35.269779, name: "Eldoret" },
  kisumu: { lat: -0.102205, lon: 34.761711, name: "Kisumu" },
  mombasa: { lat: -4.043477, lon: 39.668205, name: "Mombasa" },
  kitale: { lat: 1.015, lon: 35.0, name: "Kitale" },
  meru: { lat: 0.05, lon: 37.65, name: "Meru" },
  machakos: { lat: -1.516667, lon: 37.266667, name: "Machakos" },
};

// Weather condition mapping (WMO codes)
const getWeatherCondition = (code: number): string => {
  const conditions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    56: "Freezing drizzle", 57: "Dense freezing drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    66: "Freezing rain", 67: "Heavy freezing rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    85: "Slight snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Heavy thunderstorm with hail"
  };
  return conditions[code] || "Unknown";
};

const getWeatherIcon = (code: number, isDay: boolean): string => {
  // Map WMO codes to emoji for simplicity (no external images needed)
  if (code === 0) return isDay ? "☀️" : "🌙";
  if (code === 1 || code === 2) return isDay ? "⛅" : "☁️";
  if (code === 3) return "☁️";
  if (code >= 45 && code < 50) return "🌫️";
  if (code >= 51 && code < 70) return "🌧️";
  if (code >= 71 && code < 80) return "🌨️";
  if (code >= 80 && code < 90) return "🌦️";
  if (code >= 95) return "⛈️";
  return isDay ? "☀️" : "🌙";
};

export const weatherApi = {
  async getRegionWeather(regionKey: keyof typeof KENYA_REGIONS): Promise<WeatherData> {
    const region = KENYA_REGIONS[regionKey];
    
    try {
      // Get current weather and forecast in one call
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${region.lat}&longitude=${region.lon}` +
        `&current_weather=true` +
        `&hourly=temperature_2m,relativehumidity_2m,weathercode,visibility` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max` +
        `&timezone=auto`
      );
      
      if (!response.ok) throw new Error("Failed to fetch weather");
      
      const data = await response.json();
      
      // Process current weather
      const current = data.current_weather;
      const isDay = current.is_day === 1;
      
      // Get today's hourly data for humidity, visibility
      const currentHour = new Date().getHours();
      const currentHourIndex = data.hourly.time.findIndex((t: string) => 
        new Date(t).getHours() === currentHour
      );
      
      // Process 5-day forecast
      const forecast: WeatherForecast[] = [];
      for (let i = 0; i < 5; i++) {
        forecast.push({
          date: data.daily.time[i],
          day: new Date(data.daily.time[i]).toLocaleDateString('en-US', { weekday: 'short' }),
          maxTemp: Math.round(data.daily.temperature_2m_max[i]),
          minTemp: Math.round(data.daily.temperature_2m_min[i]),
          condition: getWeatherCondition(data.daily.weathercode[i]),
          conditionCode: data.daily.weathercode[i],
          conditionIcon: getWeatherIcon(data.daily.weathercode[i], true), // Assume day for forecast
          precipitation: data.daily.precipitation_sum[i] || 0,
          windSpeed: Math.round(data.daily.windspeed_10m_max[i])
        });
      }
      
      return {
        location: region.name,
        temperature: Math.round(current.temperature),
        feelsLike: Math.round(current.temperature), // Open-Meteo doesn't provide feels like
        humidity: data.hourly.relativehumidity_2m[currentHourIndex] || 65,
        windSpeed: Math.round(current.windspeed),
        windDirection: getWindDirection(current.winddirection),
        condition: getWeatherCondition(current.weathercode),
        conditionCode: current.weathercode,
        conditionIcon: getWeatherIcon(current.weathercode, isDay),
        visibility: data.hourly.visibility ? data.hourly.visibility[currentHourIndex] / 1000 : 10,
        pressure: 1015, // Open-Meteo free doesn't include pressure
        sunrise: "6:30 AM", // Would need another API for precise times
        sunset: "6:45 PM",
        forecast
      };
    } catch (error) {
      console.error("Weather API error:", error);
      return getMockWeatherData(region.name);
    }
  },
  
  async getFarmerWeather(farmerLocation: string): Promise<WeatherData> {
    const location = farmerLocation.toLowerCase();
    
    for (const [key, region] of Object.entries(KENYA_REGIONS)) {
      if (location.includes(key) || location.includes(region.name.toLowerCase())) {
        return this.getRegionWeather(key as keyof typeof KENYA_REGIONS);
      }
    }
    
    return this.getRegionWeather('nairobi');
  }
};

function getWindDirection(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

function getMockWeatherData(location: string): WeatherData {
  const isDay = new Date().getHours() > 6 && new Date().getHours() < 18;
  
  return {
    location,
    temperature: 24,
    feelsLike: 23,
    humidity: 65,
    windSpeed: 10,
    windDirection: "NE",
    condition: "Partly cloudy",
    conditionCode: 2,
    conditionIcon: getWeatherIcon(2, isDay),
    visibility: 10,
    pressure: 1015,
    sunrise: "6:30 AM",
    sunset: "6:45 PM",
    forecast: Array(5).fill(null).map((_, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      day: new Date(Date.now() + i * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
      maxTemp: 26 + Math.floor(Math.random() * 3),
      minTemp: 18 + Math.floor(Math.random() * 2),
      condition: "Partly cloudy",
      conditionCode: 2,
      conditionIcon: getWeatherIcon(2, true),
      precipitation: Math.random() > 0.7 ? 20 : 0,
      windSpeed: 8 + Math.floor(Math.random() * 8)
    }))
  };
}
