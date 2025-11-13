// 輕量級圖片快取（記憶體內 + LRU）
// 注意：這個快取在整個 SPA 存活期間有效；重新整理頁面會清空。

const MAX_CACHE_ITEMS = 100; // 依需求可調
const cacheMap = new Map();  // key: url, value: { objectUrl, lastUsed, size }
let imageLogoutListenerAttached = false;

async function fetchAsObjectURL(url) {
  const res = await fetch(url, { cache: "no-store" }); // 避免瀏覽器自己的快取干擾
  if (!res.ok) throw new Error(`Fetch image failed: ${res.status} ${res.statusText}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  return { objectUrl, size: blob.size || 0 };
}

function touch(key) {
  const entry = cacheMap.get(key);
  if (entry) {
    entry.lastUsed = Date.now();
    cacheMap.set(key, entry);
  }
}

function evictIfNeeded() {
  if (cacheMap.size <= MAX_CACHE_ITEMS) return;
  // LRU：找最久沒用的清掉一些（一次清 10%）
  const toRemove = Math.ceil(MAX_CACHE_ITEMS * 0.1);
  const items = [...cacheMap.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed);
  for (let i = 0; i < toRemove && i < items.length; i++) {
    const [key, entry] = items[i];
    try { URL.revokeObjectURL(entry.objectUrl); } catch (_) {}
    cacheMap.delete(key);
  }
}

/**
 * 取得快取的 Object URL，若沒有就抓取並建立快取。
 * @param {string} url
 * @param {string} [cacheKey] 可自訂 key（例如去除簽名參數），預設用 url
 * @returns {Promise<string>} objectURL
 */
export async function getCachedObjectUrl(url, cacheKey) {
  const key = cacheKey || url;
  const existing = cacheMap.get(key);
  if (existing) {
    touch(key);
    return existing.objectUrl;
  }
  try {
    const { objectUrl, size } = await fetchAsObjectURL(url);
    cacheMap.set(key, { objectUrl, size, lastUsed: Date.now() });
    evictIfNeeded();
    return objectUrl;
  } catch (err) {
    const e = new Error("IMAGE_FETCH_FAILED");
    e.cause = err;
    throw e; // 交給上層決定是否 fallback
  }
}

/**
 * 手動清掉單一快取
 */
export function clearImageCache(keyOrUrl) {
  const entry = cacheMap.get(keyOrUrl);
  if (entry) {
    try { URL.revokeObjectURL(entry.objectUrl); } catch (_) {}
    cacheMap.delete(keyOrUrl);
  }
}

/**
 * 全清
 */
export function clearAllImageCache() {
  for (const [, entry] of cacheMap) {
    try { URL.revokeObjectURL(entry.objectUrl); } catch (_) {}
  }
  cacheMap.clear();
}

if (typeof window !== "undefined" && !imageLogoutListenerAttached) {
  window.addEventListener("logout", clearAllImageCache);
  imageLogoutListenerAttached = true;
}
