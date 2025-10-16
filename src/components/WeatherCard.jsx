import React, { useState, useEffect } from 'react';

export default function WeatherCard() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // 從 .env 讀取後端 Base URL
        const BASE_URL = import.meta.env.VITE_API_BASE;
        const res = await fetch(`${BASE_URL}/weather/current?city=Taipei`);
        if (!res.ok) throw new Error(`伺服器回應異常: ${res.status}`);
        const data = await res.json();
        setWeather(data);
      } catch (err) {
        setError(err.message || '無法取得天氣資料');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) {
    return <div className="p-4 bg-gray-100 rounded-xl">載入中...</div>;
  }
  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-xl">{error}</div>;
  }
  if (!weather) {
    return null;
  }

  const dateStr = new Date().toLocaleDateString();
  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-white rounded-2xl p-4 shadow-md w-full">
      <div className="flex items-start justify-between">
        <div>
         <div className="flex flex-col items-start">
          <div className="text-sm text-indigo-600">{dateStr}</div> 
          <div className="mt-1 text-3xl font-bold text-gray-900">
            {Math.round(weather.temperature)}°C
          </div>
        </div>
          <div className="text-sm text-gray-500 capitalize">
            {weather.description} · {weather.suggestion}
          </div>
        </div>
        <img src={iconUrl} alt={weather.description} className="w-20 h-20" />
      </div>
    
    </div>
  );
}
