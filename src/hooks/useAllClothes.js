// src/hooks/useAllClothes.js
import { useEffect, useRef, useState } from "react";

// 全域快取，避免多頁重複 fetch
let globalClothesCache = null;
let globalClothesPromise = null;

export default function useAllClothes(API_BASE) {
  const [allItems, setAllItems] = useState(globalClothesCache || []);
  const [loading, setLoading] = useState(!globalClothesCache);
  const [error, setError] = useState("");

  useEffect(() => {
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
      const candidates = [
        `${API_BASE}/admin/clothes?limit=1000`,
        `${API_BASE}/admin/wardrobe/clothes?limit=1000`,
        `${API_BASE}/api/v1/clothes?limit=1000`,
        `${API_BASE}/api/v1/wardrobe/clothes?limit=1000`,
        `${API_BASE}/clothes?limit=1000`,
        `${API_BASE}/wardrobe/clothes?limit=1000`,
        `/admin/clothes?limit=1000`,
        `/admin/wardrobe/clothes?limit=1000`,
        `/api/v1/clothes?limit=1000`,
        `/api/v1/wardrobe/clothes?limit=1000`,
        `/clothes?limit=1000`,
        `/wardrobe/clothes?limit=1000`,
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
