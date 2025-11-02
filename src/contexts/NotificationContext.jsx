import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationContext = createContext();

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}

// === API 與 ID 型別設定 ===
const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';
const USER_ID_TYPE = import.meta.env.VITE_NOTIF_USER_ID_TYPE || 'auto';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// 依不同模式正規化 user_id；auto: 數字/UUID/字串 全放行
function normalizeBackendUserId(rawId) {
  if (rawId == null) return null;
  const asStr = String(rawId).trim();
  if (!asStr) return null;

  const uuidRe =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

  if (USER_ID_TYPE === 'auto') {
    if (/^\d+$/.test(asStr)) return asStr;
    if (uuidRe.test(asStr)) return asStr;
    return asStr; // 其餘字串交給後端解析
  }
  if (USER_ID_TYPE === 'int') return /^\d+$/.test(asStr) ? asStr : null;
  if (USER_ID_TYPE === 'uuid') return uuidRe.test(asStr) ? asStr : null;
  return asStr; // 'string'
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null); // { id, displayName }

  // ========== Current User ==========
  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
      if (!res.ok) {
        let txt = '';
        try { txt = await res.text(); } catch {}
        console.warn('Failed to load current user:', res.status, res.statusText, txt);
        setCurrentUser(null);
        return null;
      }
      const data = await res.json();
      const id =
        data?.id ??
        data?.user_id ??
        data?.userId ??
        data?.uid ??
        data?.uuid ??
        data?.user?.id ??
        data?.user?.user_id ??
        data?.user?.userId ??
        data?.user?.uid ??
        data?.user?.uuid ??
        null;
      const name =
        data?.display_name || data?.name || data?.user?.display_name || data?.user?.name || '用戶';
      const u = { id, displayName: name };
      setCurrentUser(u);
      return u;
    } catch (e) {
      console.error('Error fetching current user:', e);
      setCurrentUser(null);
      return null;
    }
  }, []);

  // ---------- localStorage helpers ----------
  const LOCAL_KEY = 'local_notifications';

  function loadLocalNotifications() {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.warn('Failed to load local notifications', e);
      return [];
    }
  }

  function saveLocalNotifications(arr) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
    } catch (e) {
      console.warn('Failed to save local notifications', e);
    }
  }

  function addLocalNotification(item) {
    const list = loadLocalNotifications();
    list.unshift(item);
    saveLocalNotifications(list);
    setNotifications(prev => [item, ...prev]);
    setUnreadCount(prev => prev + (item.is_read ? 0 : 1));
  }

  function removeLocalById(localId) {
    try {
      const list = loadLocalNotifications();
      const next = list.filter(x => x && String(x.id) !== String(localId));
      saveLocalNotifications(next);
      setNotifications(prev => prev.filter(n => String(n.id) !== String(localId)));
    } catch (e) {
      console.warn('Failed to remove local notification:', e);
    }
  }

  function mergeLocalWithBackend(local, backend) {
    const seen = new Set(backend.map(b => String(b.id)));
    const toastIds = new Set();
    backend.forEach(b => {
      try {
        const d = b.details;
        if (d && d.toast_id) toastIds.add(String(d.toast_id));
      } catch {}
    });

    const filteredLocal = (local || [])
      .filter(l => {
        if (!l) return false;
        if (seen.has(String(l.id))) return false;
        try {
          const d = l.details;
          if (d && d.toast_id && toastIds.has(String(d.toast_id))) return false;
        } catch {}
        return true;
      })
      .map(l => ({ ...l, _isLocal: true }));

    return [...filteredLocal, ...backend];
  }

  // ========== 從後端載入 ==========
  const fetchNotifications = useCallback(
    async (unreadOnly = false) => {
      const normId = normalizeBackendUserId(currentUser?.id);
      if (!normId) {
        console.warn(
          `Skip fetching notifications: invalid user_id for backend (USER_ID_TYPE=${USER_ID_TYPE}).`
        );
        const local = loadLocalNotifications();
        setNotifications(local);
        setUnreadCount(local.filter(n => !n.is_read).length);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({ user_id: normId, skip: '0', limit: '50' });
        if (unreadOnly) params.append('unread_only', 'true');

        const response = await fetch(`${API_BASE}/notifications/?${params}`, {
          headers: getAuthHeaders()
        });

        if (response.ok) {
          const data = await response.json();
          let backendList = (data.notifications || []).map(n => {
            let message = n.message;
            if (message && currentUser?.id) {
              message = message.replace(
                new RegExp(`\\b${String(currentUser.id)}\\b`, 'g'),
                currentUser.displayName || '用戶'
              );
            }
            return { ...n, message, unread: !n.is_read, timestamp: n.created_at };
          });

          const local = loadLocalNotifications();
          const merged = mergeLocalWithBackend(local, backendList);
          setNotifications(merged);
          setUnreadCount(
            (data.unread_count || 0) + merged.filter(n => n._isLocal && !n.is_read).length
          );
        } else {
          let errText = '';
          try { errText = await response.text(); } catch {}
          console.error('Failed to fetch notifications:', response.status, response.statusText, errText);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    },
    [currentUser]
  );

  // ========== 把本機暫存回填到後端 ==========
  const flushLocalToBackend = useCallback(async () => {
    const normId = normalizeBackendUserId(currentUser?.id);
    if (!normId) return;

    const locals = loadLocalNotifications();
    if (!locals.length) return;

    for (const ln of locals) {
      try {
        const body = {
          user_id: String(normId),
          type: ln.type || 'new_item',
          message: ln.message || '',
          details: ln.details || null,
          payload: ln.payload || null
        };
        const res = await fetch(`${API_BASE}/notifications/`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(body)
        });
        if (res.ok) removeLocalById(ln.id);
      } catch (e) {
        console.warn('flushLocalToBackend failed for one item:', e);
      }
    }
  }, [currentUser]);

  // 初次載入
  useEffect(() => { fetchCurrentUser(); }, [fetchCurrentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications().then(() => flushLocalToBackend());
    }
  }, [currentUser, fetchNotifications, flushLocalToBackend]);

  // ========== Toast 事件轉通知 ==========
  useEffect(() => {
    const handler = async e => {
      const payload = e?.detail;
      if (!payload) return;

      const notif = {
        type: payload.type === 'error' ? 'error' : 'info',
        message: payload.title ? `${payload.title}: ${payload.message}` : payload.message,
        details: { source: 'client-toast', toast_id: payload.id }
      };
      try {
        await addNotification(notif, { optimistic: true });
      } catch (err) {
        console.error('Failed to persist toast as notification:', err);
      }
    };

    window.addEventListener('toast-fired', handler);
    return () => window.removeEventListener('toast-fired', handler);
  }, [currentUser]);

  // ========== 建立 / 更新 / 刪除 ==========
  const pendingToastIdsRef = React.useRef(new Set());

  const addNotification = useCallback(
    async (notification, opts = { optimistic: true }) => {
      const toastId = notification?.details?.toast_id ?? null;

      if (toastId) {
        const exists = notifications.some(n => n.details && n.details.toast_id === toastId);
        if (exists || pendingToastIdsRef.current.has(String(toastId))) return;
      }

      let normId = normalizeBackendUserId(currentUser?.id);
      if (!normId) {
        const u = await fetchCurrentUser();
        normId = normalizeBackendUserId(u?.id);
      }

      const makeLocalItem = baseId => ({
        id: baseId || `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        user_id: normId ?? null,
        type: notification.type || 'new_item',
        message: notification.message,
        details: notification.details || null,
        payload: notification.payload || null,
        is_read: false,
        created_at: new Date().toISOString(),
        _isLocal: true
      });

      if (!normId) {
        console.warn('No valid user_id for backend; saving notification locally.');
        return addLocalNotification(makeLocalItem());
      }

      let tempId = null;
      try {
        const body = {
          user_id: String(normId),
          type: notification.type || 'new_item',
          message: notification.message
        };
        if (notification.details) body.details = notification.details;
        if (notification.payload) body.payload = notification.payload;

        if (opts.optimistic) {
          tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          const tempNotif = {
            id: tempId,
            user_id: normId,
            type: body.type,
            message: body.message,
            details: body.details || null,
            payload: body.payload || null,
            is_read: false,
            created_at: new Date().toISOString(),
            pending: true
          };
          setNotifications(prev => [tempNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
          if (toastId) pendingToastIdsRef.current.add(String(toastId));
        }

        const response = await fetch(`${API_BASE}/notifications/`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(body)
        });

        if (response.ok) {
          const data = (await response.json().catch(() => null)) || {};
          const item = {
            id: data.id || String(data.id) || (tempId || `n-${Date.now()}`),
            user_id: data.user_id ?? normId,
            type: data.type ?? body.type,
            message: data.message ?? body.message,
            details: data.details ?? body.details ?? null,
            payload: data.payload ?? body.payload ?? null,
            is_read: data.is_read ?? false,
            created_at: data.created_at ?? new Date().toISOString()
          };

          if (tempId) {
            setNotifications(prev => prev.map(n => (n.id === tempId ? item : n)));
          } else {
            setNotifications(prev => [item, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        } else {
          const txt = await response.text().catch(() => '');
          console.warn(
            'Failed to create notification on server; saving locally. Server response:',
            response.status,
            response.statusText,
            txt
          );
          if (tempId) {
            setNotifications(prev => prev.filter(n => n.id !== tempId));
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
          addLocalNotification(makeLocalItem());
        }
      } catch (error) {
        console.warn('Error creating notification (network/exception); saving locally:', error);
        if (tempId) {
          setNotifications(prev => prev.filter(n => n.id !== tempId));
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        addLocalNotification(makeLocalItem());
      } finally {
        if (toastId) pendingToastIdsRef.current.delete(String(toastId));
      }
    },
    [currentUser, fetchCurrentUser, notifications]
  );

  const markAsRead = async id => {
    let normId = normalizeBackendUserId(currentUser?.id);
    if (!normId) {
      const u = await fetchCurrentUser();
      normId = normalizeBackendUserId(u?.id);
    }
    if (!normId) return;

    try {
      const response = await fetch(`${API_BASE}/notifications/${id}?user_id=${normId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_read: true })
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, unread: false, is_read: true } : n)));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    let normId = normalizeBackendUserId(currentUser?.id);
    if (!normId) {
      const u = await fetchCurrentUser();
      normId = normalizeBackendUserId(u?.id);
    }
    if (!normId) return;

    try {
      const response = await fetch(`${API_BASE}/notifications/mark-all-read?user_id=${normId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const clearNotification = async id => {
    let normId = normalizeBackendUserId(currentUser?.id);
    if (!normId) {
      const u = await fetchCurrentUser();
      normId = normalizeBackendUserId(u?.id);
    }
    if (!normId) return;

    try {
      const response = await fetch(`${API_BASE}/notifications/${id}?user_id=${normId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok || response.status === 204) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        const notification = notifications.find(n => n.id === id);
        if (notification && (notification.unread || !notification.is_read)) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    let normId = normalizeBackendUserId(currentUser?.id);
    if (!normId) {
      const u = await fetchCurrentUser();
      normId = normalizeBackendUserId(u?.id);
    }
    if (!normId) return;

    try {
      const response = await fetch(`${API_BASE}/notifications/?user_id=${normId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    currentUser,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    refreshNotifications: fetchNotifications
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
