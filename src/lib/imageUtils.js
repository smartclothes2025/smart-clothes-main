// src/lib/imageUtils.js

/**
 * 解析 Google Cloud Storage (GCS) URI 為可訪問的 HTTPS URL
 * @param {string} gsOrHttp - GCS URI (gs://...) 或已經是 HTTP(S) URL
 * @returns {string|null} 可訪問的 HTTPS URL 或 null
 */
export function resolveGcsUrl(gsOrHttp) {
  if (!gsOrHttp) return null;
  
  // 如果已經是 HTTP(S) URL，直接返回
  if (gsOrHttp.startsWith("http://") || gsOrHttp.startsWith("https://")) {
    return gsOrHttp;
  }
  
  // 處理 gs:// URI 格式
  if (gsOrHttp.startsWith("gs://")) {
    const without = gsOrHttp.replace("gs://", "");
    const slash = without.indexOf("/");
    
    if (slash > 0) {
      const bucket = without.slice(0, slash);
      const object = encodeURI(without.slice(slash + 1));
      return `https://storage.cloud.google.com/${bucket}/${object}`;
    }
  }
  
  // 無法解析，返回原值
  return gsOrHttp;
}

/**
 * 從 API 回應物件中提取圖片 URL
 * 嘗試多個可能的欄位名稱並解析 GCS URI
 * @param {Object} item - API 回應的物件
 * @returns {string|null} 解析後的圖片 URL 或 null
 */
export function getImageUrl(item) {
  if (!item) return null;
  
  // 按優先順序嘗試不同的欄位名稱
  const rawUrl = 
    item.imageUrl || 
    item.cover_url || 
    item.img || 
    item.cover_image_url || 
    item.image_url || 
    "";
  
  return resolveGcsUrl(rawUrl);
}

/**
 * 修正可能損壞的圖片 URL
 * 處理常見的 URL 格式錯誤
 * @param {string} url - 原始 URL
 * @returns {string} 修正後的 URL
 */
export function fixImageUrl(url) {
  if (!url) return "";
  
  let fixedUrl = url;
  
  // 移除可能被錯誤拼接的本地 host 前綴
  const localHostPrefixes = [
    'http://localhost:5173/',
    'http://127.0.0.1:5173/',
    'http://localhost:3000/',
  ];
  
  for (const prefix of localHostPrefixes) {
    if (fixedUrl.startsWith(prefix)) {
      fixedUrl = fixedUrl.substring(prefix.length);
      console.warn(`[fixImageUrl] 移除本地 Host 前綴: ${fixedUrl}`);
    }
  }
  
  // 修正協議格式問題 (https/ -> https://)
  if (fixedUrl.startsWith('https/')) {
    fixedUrl = 'https://' + fixedUrl.substring(6);
    console.warn(`[fixImageUrl] 修正協議格式: ${fixedUrl}`);
  }
  
  if (fixedUrl.startsWith('http/')) {
    fixedUrl = 'http://' + fixedUrl.substring(5);
    console.warn(`[fixImageUrl] 修正協議格式: ${fixedUrl}`);
  }
  
  // 如果是 storage.googleapis.com 但缺少協議，補上 https://
  if (fixedUrl.startsWith('storage.googleapis.com')) {
    fixedUrl = 'https://' + fixedUrl;
    console.warn(`[fixImageUrl] 補回完整協定頭: ${fixedUrl}`);
  }
  
  return fixedUrl;
}

/**
 * 為圖片 URL 添加 cache-busting 參數
 * @param {string} url - 原始 URL
 * @param {number} timestamp - 時間戳，預設為當前時間
 * @returns {string} 帶有 cache-busting 參數的 URL
 */
export function addCacheBusting(url, timestamp = Date.now()) {
  if (!url) return "";
  
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${timestamp}`;
}

/**
 * 獲取預設佔位圖片 URL
 * @param {number} width - 圖片寬度
 * @param {number} height - 圖片高度
 * @param {string} text - 顯示文字
 * @returns {string} 佔位圖片 URL
 */
export function getPlaceholderImage(width = 200, height = 200, text = "No Image") {
  return `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(text)}`;
}
