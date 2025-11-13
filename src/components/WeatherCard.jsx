// src/components/WeatherCard.jsx
import React from 'react';
import useSWR from 'swr'; // 引入 useSWR
import fetchJSON from '../lib/api'; // 引入我們統一的 fetcher

export default function WeatherCard() {
  // 從 .env 讀取後端 Base URL
  const BASE_URL = import.meta.env.VITE_API_BASE;
  const url = `${BASE_URL}/weather/current?city=Taipei`;

  // 🚨 使用 useSWR 取代 useEffect 和 useState
  const { 
    data: weather, 
    error, 
    isLoading: loading 
  } = useSWR(
    url, // SWR 的快取 Key
    fetchJSON, // 數據獲取函數
    {
      // --- 暫存與自動更新設定 ---
      revalidateOnFocus: true, // 1. 當用戶切換視窗回來時，自動重新整理
      refreshInterval: 600000, // 2. 每 10 分鐘 (600,000 ms) 自動在背景更新一次
      dedupingInterval: 300000, // 3. 5 分鐘內避免重複請求 (例如快速切換頁面)
    }
  );

  // 載入中 (SWR 正在 initial loading)
  if (loading) {
    return <div className="p-4 bg-gray-100 rounded-xl">載入中...</div>;
  }
  
  // 錯誤 (SWR 請求失敗)
  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-xl">{error.message || '無法取得天氣資料'}</div>;
  }
  
  // 成功，但沒有資料
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