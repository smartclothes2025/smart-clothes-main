// 簡易 sessionStorage 快取（含到期時間）
const SAFE_STORAGE = typeof window !== "undefined" ? window.sessionStorage : undefined;
const DEFAULT_TTL = 15 * 60 * 1000;

export function getSessionCache(key) {
  if (!SAFE_STORAGE) return null;
  try {
    const raw = SAFE_STORAGE.getItem(key);
    if (!raw) return null;
    const { expiresAt, value } = JSON.parse(raw);
    if (expiresAt && Date.now() > expiresAt) {
      SAFE_STORAGE.removeItem(key);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function setSessionCache(key, value, ttlMs = DEFAULT_TTL) {
  if (!SAFE_STORAGE) return;
  const payload = {
    value,
    expiresAt: ttlMs > 0 ? Date.now() + ttlMs : null,
  };
  try {
    SAFE_STORAGE.setItem(key, JSON.stringify(payload));
  } catch {}
}

export function removeSessionCache(key) {
  if (!SAFE_STORAGE) return;
  try {
    SAFE_STORAGE.removeItem(key);
  } catch {}
}

export function buildSessionCacheKey(prefix, token) {
  return token ? `${prefix}:${token}` : prefix;
}

export function clearSessionCacheByPrefix(prefix) {
  if (!SAFE_STORAGE || !prefix) return;
  try {
    const keys = [];
    for (let i = 0; i < SAFE_STORAGE.length; i += 1) {
      const name = SAFE_STORAGE.key(i);
      if (name && name.startsWith(prefix)) keys.push(name);
    }
    keys.forEach((name) => SAFE_STORAGE.removeItem(name));
  } catch {}
}

export const SESSION_CACHE_DEFAULT_TTL = DEFAULT_TTL;
