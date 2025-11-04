// src/hooks/useAllClothes.js
import { useEffect, useRef, useState } from "react";
import { MockClothesApi } from "../mock/clothesMockData";

// 全域快取，避免多頁重複 fetch
let globalClothesCache = null;
let globalClothesPromise = null;

export default function useAllClothes(API_BASE) {
  const [allItems, setAllItems] = useState(globalClothesCache || []);
  const [loading, setLoading] = useState(!globalClothesCache);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if mock mode is enabled
    const useMock = import.meta.env.VITE_USE_MOCK === 'true';

    if (globalClothesCache) {
      setAllItems(globalClothesCache);
      setLoading(false);
      return;
    }
    if (globalClothesPromise) {
      globalClothesPromise.then(setAllItems).catch(e => setError(e?.message || "讀取失敗")).finally(() => setLoading(false));
      return;
    }
    setLoading(true);
    setError("");
    
    globalClothesPromise = (async () => {
      // If mock mode is enabled, return mock data
      if (useMock) {
        console.log('🎭 Using mock clothes data');
        const mockData = await MockClothesApi.getAllClothes();
        globalClothesCache = mockData;
        return globalClothesCache;
      }

      // Otherwise, try to fetch from API with corrected endpoints
      // Note: API_BASE already includes /api/v1
      const candidates = [
        `${API_BASE}/clothes?limit=1000`,
        `/api/v1/clothes?limit=1000`,
        `${API_BASE}/admin/clothes?limit=1000`,
        `/api/v1/admin/clothes?limit=1000`,
      ];
      let data = null;
      let lastInfo = null;
      for (const url of candidates) {
        try {
          const res = await fetch(url, { headers: { Accept: 'application/json' } });
          if (!res.ok) {
            const txt = await res.text().catch(() => '');
            lastInfo = { url, status: res.status, text: txt };
            continue;
          }
          data = await res.json();
          console.log(`✅ Successfully fetched from: ${url}`);
          break;
        } catch (err) {
          lastInfo = err;
        }
      }
      if (!data) throw new Error(`fetch failed for all candidates: ${JSON.stringify(lastInfo)}`);
      // 直接回傳原始陣列，正規化交由頁面端處理
      globalClothesCache = Array.isArray(data) ? data : [];
      return globalClothesCache;
    })();
    globalClothesPromise.then(setAllItems).catch(e => setError(e?.message || "讀取失敗")).finally(() => setLoading(false));
  }, [API_BASE]);

  return { allItems, loading, error };
}
