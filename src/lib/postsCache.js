const API_BASE = import.meta.env.VITE_API_BASE || "https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1";

const caches = { public: null, mine: null };
const promises = { public: null, mine: null };
let logoutListenerAttached = false;

function storedToken(token) {
  if (token) return token;
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
}

function resolveGcsUrl(input) {
  if (!input) return null;
  if (input.startsWith("http://") || input.startsWith("https://")) return input;
  if (input.startsWith("gs://")) {
    const without = input.slice(5);
    const slash = without.indexOf("/");
    if (slash > 0) {
      const bucket = without.slice(0, slash);
      const object = encodeURI(without.slice(slash + 1));
      return `https://storage.googleapis.com/${bucket}/${object}`;
    }
  }
  return input;
}

async function signGcsUri(gcsUri, token) {
  if (!gcsUri) return null;
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE}/media/signed-url?gcs_uri=${encodeURIComponent(gcsUri)}`, { headers });
    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return data.authenticated_url || data.url || null;
  } catch {
    return null;
  }
}

async function resolveMediaArray(mediaArr, token) {
  const output = [];
  for (const item of mediaArr || []) {
    const direct = item?.authenticated_url || item?.url || item?.image_url;
    if (direct) {
      output.push({ ...item, _view: direct });
      continue;
    }
    const gcs = item?.gcs_uri || item?.image || null;
    if (!gcs) {
      output.push(item);
      continue;
    }
    let signed = await signGcsUri(gcs, token); 
    if (!signed) signed = resolveGcsUrl(gcs);
    output.push({ ...item, _view: signed });
  }
  return output;
}

async function fetchPosts(url, token, signal) {
  const headers = { Accept: "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await fetch(url, { headers, signal });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  const raw = await res.json();
  const list = [];
  for (const item of raw || []) {
    let mediaArr = [];
    try {
      if (Array.isArray(item.media)) mediaArr = item.media;
      else if (typeof item.media === "string") mediaArr = JSON.parse(item.media || "[]");
    } catch {
      mediaArr = [];
    }
    const resolved = await resolveMediaArray(mediaArr, token);
    list.push({ ...item, _mediaArr: resolved });
  }
  return list;
}

// 🚨 補上遺漏的 fetchWithCache 函數定義
async function fetchWithCache(scope, url, token, signal) {
  if (caches[scope]) return caches[scope];
  if (promises[scope]) return promises[scope];
  promises[scope] = fetchPosts(url, token, signal)
    .then((data) => {
      setCache(scope, data);
      return caches[scope];
    })
    .finally(() => {
      promises[scope] = null;
    });
  return promises[scope];
}

function setCache(scope, data) {
  caches[scope] = Array.isArray(data) ? data : [];
}

function clearCache(scope) {
  caches[scope] = null;
  promises[scope] = null;
}

/**
 * 獲取公開貼文 (不應傳送 Token)
 */
export async function getPublicPosts(options = {}) {
  // 修正點：強制傳入 null，確保請求是匿名發送
  return fetchWithCache(
    "public", 
    `${API_BASE}/posts/?visibility=public&limit=50`, 
    null, // 👈 確保不傳送 Token
    options.signal
  );
}

/**
 * 獲取我的貼文 (必須傳送 Token，且不能是訪客)
 */
export async function getMyPosts(options = {}) {
  const token = storedToken(options.token);

  if (!token || token.startsWith('guest-token')) {
    console.warn("[getMyPosts] 訪客或未登入，拒絕獲取 '我的貼文'。");
    return Promise.reject(new Error("訪客無法查看個人貼文，請先登入。"));
  }

  return fetchWithCache(
    "mine", 
    `${API_BASE}/posts/?scope=mine&limit=30`, 
    token,
    options.signal
  );
}

export function setPostsCache(scope, data) {
  if (scope === "public" || scope === "mine") setCache(scope, data);
}

export function clearPostsCache(scope) {
  if (scope) {
    if (scope === "public" || scope === "mine") clearCache(scope);
    return;
  }
  clearCache("public");
  clearCache("mine");
}

if (typeof window !== "undefined" && !logoutListenerAttached) {
  window.addEventListener("logout", () => clearPostsCache());
  logoutListenerAttached = true;
}