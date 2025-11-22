// src/components/WeatherCard.jsx
import React from 'react';
import { useWeather } from '../hooks/useWeather'; // 使用統一的天氣 hook

export default function WeatherCard() {
  // 使用統一的天氣 hook - 依使用者所在位置顯示天氣
  const { weather, error, isLoading } = useWeather();

  if (isLoading) {
    return <div className="p-4 bg-gray-100 rounded-xl text-left">載入中...</div>;
  }
  
  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-xl text-left">{error.message || '無法取得天氣資料'}</div>;
  }
  
  if (!weather) {
    return null;
  }

  const dateStr = new Date().toLocaleDateString();
  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-white rounded-2xl p-4 shadow-md w-full text-left">
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