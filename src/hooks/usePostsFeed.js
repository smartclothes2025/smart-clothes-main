import { useEffect, useRef, useState } from "react";
import { getSessionCache, setSessionCache } from "../lib/sessionCache";

const CACHE_KEY_DATA = "posts_feed_cache_v1";
const CACHE_KEY_SCROLL = "posts_feed_scroll_v1";

// 小工具：去掉 query（做為穩定 key）
export function stripQuery(u) {
  try { const url = new URL(u); url.search = ""; return url.toString(); }
  catch { return u; }
}

/**
 * props:
 *  - fetcher: () => Promise<Post[]>  你現有的抓貼文函式
 *  - ttlMs: 快取壽命（預設 15 分鐘）
 */
export function usePostsFeed(fetcher, ttlMs = 15 * 60 * 1000) {
  const [posts, setPosts] = useState(() => getSessionCache(CACHE_KEY_DATA) || []);
  const [loading, setLoading] = useState(posts.length === 0);
  const [error, setError] = useState(null);
  const restoringRef = useRef(false);

  // 首次載入：如果 cache 有資料，先用；然後背景更新一次
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(posts.length === 0);
        const fresh = await fetcher();
        if (!alive) return;
        setPosts(fresh);
        setSessionCache(CACHE_KEY_DATA, fresh, ttlMs);
      } catch (e) {
        if (alive) setError(e?.message || "載入失敗");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只跑一次

  // 恢復捲動位置（只在第一次進到頁面時）
  useEffect(() => {
    if (restoringRef.current) return;
    restoringRef.current = true;
    const y = getSessionCache(CACHE_KEY_SCROLL);
    if (typeof y === "number") {
      // 等到下一個 tick，確保列表畫出來
      setTimeout(() => window.scrollTo(0, y), 0);
    }
  }, []);

  // 在跳頁前/卸載時，記住捲動位置
  useEffect(() => {
    const handler = () => {
      try { setSessionCache(CACHE_KEY_SCROLL, window.scrollY, 24 * 60 * 60 * 1000); } catch {}
    };
    window.addEventListener("pagehide", handler);
    window.addEventListener("beforeunload", handler);
    return () => {
      handler();
      window.removeEventListener("pagehide", handler);
      window.removeEventListener("beforeunload", handler);
    };
  }, []);

  return { posts, setPosts, loading, error };
}
