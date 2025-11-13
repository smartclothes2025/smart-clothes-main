const API_BASE = import.meta.env.VITE_API_BASE || "https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1";

let userProfileCache = null;
let userProfilePromise = null;
let profileLogoutListenerAttached = false;

function getToken(explicitToken) {
  if (explicitToken) return explicitToken;
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
}

export function clearProfileCache() {
  userProfileCache = null;
  userProfilePromise = null;
}

export function setProfileCache(data) {
  userProfileCache = data ? { ...data } : null;
  userProfilePromise = null;
}

export async function getProfileData({ token } = {}) {
  const effectiveToken = getToken(token);
  if (!effectiveToken) throw new Error("NO_TOKEN");

  if (userProfileCache) return userProfileCache;
  if (!userProfilePromise) {
    userProfilePromise = (async () => {
      const headers = { Authorization: `Bearer ${effectiveToken}`, Accept: "application/json" };
      const [authRes, metricRes] = await Promise.all([
        fetch(`${API_BASE}/auth/me`, { headers }),
        fetch(`${API_BASE}/me/body_metrics`, { headers }),
      ]);

      if (authRes.status === 401 || metricRes.status === 401) {
        throw new Error("UNAUTHORIZED");
      }

      const authData = authRes.ok ? await authRes.json().catch(() => ({})) : {};
      const metrics = metricRes.ok ? await metricRes.json().catch(() => ({})) : {};

      const merged = {
        auth: authData,
        metrics,
      };

      userProfileCache = merged;
      return merged;
    })().finally(() => {
      userProfilePromise = null;
    });
  }
  return userProfilePromise;
}

if (typeof window !== "undefined" && !profileLogoutListenerAttached) {
  window.addEventListener("logout", clearProfileCache);
  profileLogoutListenerAttached = true;
}
