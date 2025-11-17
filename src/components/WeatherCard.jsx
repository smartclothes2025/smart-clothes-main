// src/components/WeatherCard.jsx
import React, { useEffect, useState } from 'react';
import useSWR from 'swr'; // 引入 useSWR
import fetchJSON from '../lib/api'; // 引入我們統一的 fetcher

export default function WeatherCard() {
  // 從 .env 讀取後端 Base URL
  const BASE_URL = import.meta.env.VITE_API_BASE;
  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('此裝置不支援定位功能');
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocating(false);
      },
      (error) => {
        setGeoError(error.message || '無法取得定位');
        setLocating(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000,
      }
    );
  }, []);

  const url = BASE_URL
    ? coords
      ? `${BASE_URL}/weather/current?lat=${coords.latitude}&lon=${coords.longitude}`
      : `${BASE_URL}/weather/current?city=Taipei`
    : null;

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

  if (!BASE_URL) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-xl text-left">未設定 VITE_API_BASE，無法取得天氣資料</div>;
  }

  if (locating && !coords) {
    return <div className="p-4 bg-gray-100 rounded-xl text-left">正在取得定位...</div>;
  }

  if (geoError && !coords) {
    return <div className="p-4 bg-yellow-100 text-yellow-700 rounded-xl text-left">{`定位失敗：${geoError}`}</div>;
  }

  if (loading) {
    return <div className="p-4 bg-gray-100 rounded-xl text-left">載入中...</div>;
  }
  
  // 錯誤 (SWR 請求失敗)
  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-xl text-left">{error.message || '無法取得天氣資料'}</div>;
  }
  
  // 成功，但沒有資料
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