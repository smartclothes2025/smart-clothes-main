// src/hooks/usePostsFeed.js
import { useEffect, useRef, useState, useCallback } from "react";
import { getSessionCache, setSessionCache, removeSessionCache } from "../lib/sessionCache";

export function stripQuery(u) {
  try { const url = new URL(u); url.search = ""; return url.toString(); }
  catch { return u; }
}

/**
 * 可重複使用的貼文 Feed 鉤子 (支援 Session 快取)
 * @param {Function} fetcher - 抓取資料的異步函數
 * @param {string} cacheKey - 用於 sessionStorage 的鍵名
 * @param {number} [ttlMs=900000] - 快取存活時間 (預設 15 分鐘)
 */
export function usePostsFeed(fetcher, cacheKey, ttlMs = 15 * 60 * 1000) {
  const [posts, setPosts] = useState(() => getSessionCache(cacheKey) || []);
  const [loading, setLoading] = useState(posts.length === 0);
  const [error, setError] = useState(null);
  const restoringRef = useRef(false);
  const scrollCacheKey = `${cacheKey}_scroll`;

  // 封裝載入邏輯
  const load = useCallback(async (signal) => {
    // 檢查快取
    const cached = getSessionCache(cacheKey);
    if (cached) {
      setPosts(cached);
      setLoading(false); // 有快取，不顯示載入中
    } else {
      setLoading(true); // 無快取，顯示載入中
    }
    
    try {
      const fresh = await fetcher({ signal });
      if (Array.isArray(fresh)) {
        setPosts(fresh);
        setSessionCache(cacheKey, fresh, ttlMs);
      }
    } catch (e) {
      if (e?.name !== "AbortError") {
        console.warn(`[usePostsFeed] ${cacheKey} 載入失敗:`, e);
        setError(e?.message || "載入失敗");
      }
    } finally {
      setLoading(false);
    }
  }, [fetcher, cacheKey, ttlMs]);

  // 初始載入
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // 恢復捲動位置
  useEffect(() => {
    if (restoringRef.current) return;
    restoringRef.current = true;
    const y = getSessionCache(scrollCacheKey);
    if (typeof y === "number") {
      setTimeout(() => window.scrollTo(0, y), 0);
    }
  }, [scrollCacheKey]);

  // 儲存捲動位置
  useEffect(() => {
    const handler = () => {
      try { setSessionCache(scrollCacheKey, window.scrollY, 24 * 60 * 60 * 1000); } catch {}
    };
    window.addEventListener("pagehide", handler);
    window.addEventListener("beforeunload", handler);
    return () => {
      handler();
      window.removeEventListener("pagehide", handler);
      window.removeEventListener("beforeunload", handler);
    };
  }, [scrollCacheKey]);
  
  // 導出 mutate 函數，用於手動清除快取並重新整理
  const mutate = useCallback(() => {
      console.log(`[usePostsFeed] Mutating ${cacheKey}`);
      removeSessionCache(cacheKey);
      const controller = new AbortController();
      load(controller.signal);
  }, [load, cacheKey]);

  return { posts, setPosts, loading, error, mutate };
}