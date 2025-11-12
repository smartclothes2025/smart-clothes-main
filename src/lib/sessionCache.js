// 簡易 sessionStorage 快取（含到期時間）
export function getSessionCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { expiresAt, value } = JSON.parse(raw);
    if (expiresAt && Date.now() > expiresAt) {
      sessionStorage.removeItem(key);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function setSessionCache(key, value, ttlMs = 15 * 60 * 1000) {
  const payload = {
    value,
    expiresAt: ttlMs > 0 ? Date.now() + ttlMs : null,
  };
  sessionStorage.setItem(key, JSON.stringify(payload));
}

export function removeSessionCache(key) {
  sessionStorage.removeItem(key);
}
