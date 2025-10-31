import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationContext = createContext();

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
}

// API 設定 - 以環境變數為主；預設走 Vite 代理的 /api/v1
const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';
// 後端 user_id 型別控制：int | uuid | string（預設 int）
const USER_ID_TYPE = import.meta.env.VITE_NOTIF_USER_ID_TYPE || 'int';

// 從 localStorage 取得 token（僅用於授權標頭，不再從 localStorage 讀 user_id）
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// 依後端預期正規化 user_id，不符合則回傳 null
function normalizeBackendUserId(rawId) {
    if (rawId == null) return null;
    const asStr = String(rawId).trim();
    if (!asStr) return null;

    if (USER_ID_TYPE === 'int') {
        // 僅接受純數字
        return /^\d+$/.test(asStr) ? asStr : null;
    }
    if (USER_ID_TYPE === 'uuid') {
        // 簡易 UUID v4 格式檢查
        const uuidRe = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
        return uuidRe.test(asStr) ? asStr : null;
    }
    // 'string' 模式：任何非空字串可用
    return asStr;
}

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentUser, setCurrentUser] = useState(null); // { id, displayName }

    // 取得已驗證使用者（不從 localStorage 抓 user_id）
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
            // 更穩健地提取使用者 ID 與名稱
            const id =
                data?.id ?? data?.user_id ?? data?.userId ?? data?.uid ?? data?.uuid ??
                data?.user?.id ?? data?.user?.user_id ?? data?.user?.userId ?? data?.user?.uid ?? data?.user?.uuid ?? null;
            const name = data?.display_name || data?.name || data?.user?.display_name || data?.user?.name || '用戶';
            const u = { id, displayName: name };
            setCurrentUser(u);
            return u;
        } catch (e) {
            console.error('Error fetching current user:', e);
            setCurrentUser(null);
            return null;
        }
    }, []);

    // 從後端載入通知
    const fetchNotifications = useCallback(async (unreadOnly = false) => {
        const normId = normalizeBackendUserId(currentUser?.id);
        if (!normId) {
            console.warn(`Skip fetching notifications: invalid user_id for backend (USER_ID_TYPE=${USER_ID_TYPE}).`);
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams({
                user_id: normId,
                skip: '0',
                limit: '50',
            });
            
            if (unreadOnly) {
                params.append('unread_only', 'true');
            }

            const response = await fetch(`${API_BASE}/notifications/?${params}`, {
                headers: getAuthHeaders(),
            });

        if (response.ok) {
                const data = await response.json();
                // 轉換後端格式為前端格式，並將訊息中的 user_id 替換為 display_name
                setNotifications(data.notifications.map(n => {
                    let message = n.message;
                    // 將訊息中的 user_id 替換為 display_name
            if (message && currentUser?.id) {
                        message = message.replace(
                new RegExp(`\\b${currentUser.id}\\b`, 'g'),
                currentUser.displayName || '用戶'
                        );
                    }
                    return {
                        ...n,
                        message: message,
                        unread: !n.is_read,
                        timestamp: n.created_at,
                    };
                }));
                setUnreadCount(data.unread_count);
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
    }, [currentUser]);

    // 初始載入：先取得目前使用者，再載入通知
    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);

    useEffect(() => {
        if (currentUser) {
            fetchNotifications();
        }
    }, [currentUser, fetchNotifications]);

    // 建立通知（發送到後端）
    const addNotification = async (notification) => {
        let normId = normalizeBackendUserId(currentUser?.id);
        if (!normId) {
            // 嘗試重新抓取一次目前使用者，並立即使用回傳值避免 state 更新延遲
            const u = await fetchCurrentUser();
            normId = normalizeBackendUserId(u?.id);
        }
        if (!normId) {
            console.warn('No user_id found, cannot create notification');
            return;
        }

        try {
            // 僅發送後端可能允許的欄位，並確保 user_id 是字串（後端要求 string）
            const body = {
        user_id: String(normId),
                type: notification.type || 'new_item',
                message: notification.message,
            };
            if (notification.details) body.details = notification.details;
            // 若後端未定義 payload，避免送出以免 400

            const response = await fetch(`${API_BASE}/notifications/`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(body),
            });

            if (response.ok) {
                // 重新載入通知列表
                await fetchNotifications();
            } else {
                let errText = '';
                try { errText = await response.text(); } catch {}
                console.error('Failed to create notification:', response.status, response.statusText, errText);
            }
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    };

    // 標記單一通知為已讀
    const markAsRead = async (id) => {
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
                body: JSON.stringify({ is_read: true }),
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => (n.id === id ? { ...n, unread: false, is_read: true } : n))
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // 標記全部為已讀
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
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => ({ ...n, unread: false, is_read: true }))
                );
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // 刪除單一通知
    const clearNotification = async (id) => {
        let normId = normalizeBackendUserId(currentUser?.id);
        if (!normId) {
            const u = await fetchCurrentUser();
            normId = normalizeBackendUserId(u?.id);
        }
        if (!normId) return;

        try {
            const response = await fetch(`${API_BASE}/notifications/${id}?user_id=${normId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (response.ok || response.status === 204) {
                setNotifications(prev => prev.filter(n => n.id !== id));
                // 如果刪除的是未讀通知，減少未讀計數
                const notification = notifications.find(n => n.id === id);
                if (notification && notification.unread) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    // 刪除所有通知
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
                headers: getAuthHeaders(),
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
        refreshNotifications: fetchNotifications,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}
