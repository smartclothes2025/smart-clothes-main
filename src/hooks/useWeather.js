import { useEffect, useState } from 'react';
import useSWR from 'swr';
import fetchJSON from '../lib/api';

/**
 * 統一的天氣 Hook（依使用者所在位置）
 *
 * - 優先使用瀏覽器 geolocation 取得經緯度
 * - 失敗時，改用預設城市（例如 Taipei）查詢
 * - 所有頁面共用這個 hook，確保顯示的天氣一致
 */
export function useWeather(defaultCity = 'Taipei') {
  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
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

  // 只有在：
  // 1) 取得座標，或
  // 2) 定位失敗（locating=false, coords=null）
  // 時才發出請求；避免在定位進行中重複請求
  const shouldUseCityFallback = !coords && !locating;

  const key = coords
    ? `/api/v1/weather/current?lat=${coords.latitude}&lon=${coords.longitude}`
    : shouldUseCityFallback
      ? `/api/v1/weather/current?city=${encodeURIComponent(defaultCity)}`
      : null;

  const { data, error, isLoading } = useSWR(
    key,
    fetchJSON,
    {
      revalidateOnFocus: true,
      refreshInterval: 600000, // 每 10 分鐘在背景更新
      dedupingInterval: 300000, // 5 分鐘內避免重複請求
    }
  );

  return {
    weather: data,
    error,
    isLoading: locating || isLoading,
    locating,
    geoError,
  };
}
