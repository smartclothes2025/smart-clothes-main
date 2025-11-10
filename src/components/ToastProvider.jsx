// src/components/ToastProvider.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const DEFAULT_AUTO_DISMISS = 4200; // 預設自動關閉時間
const ToastContext = createContext(null);
const LOCAL_NOTIFICATIONS_KEY = 'local_notifications'; // 與 Notice.jsx 保持一致

// Toast 類型映射到通知類型
const TOAST_TO_NOTIFICATION_TYPE = {
  success: 'new_item',
  error: 'alert',
  warning: 'alert',
  info: 'system',
};

// 保存通知到 localStorage
function saveToastAsNotification({ id, type, title, message }) {
  try {
    const notifications = JSON.parse(localStorage.getItem(LOCAL_NOTIFICATIONS_KEY) || '[]');
    
    const notification = {
      id: `toast-${id}-${Date.now()}`, // 確保唯一性
      type: TOAST_TO_NOTIFICATION_TYPE[type] || 'system',
      message: title || message || '通知',
      details: title ? message : null, // 如果有標題，則 message 作為詳細內容
      timestamp: new Date().toISOString(),
      is_read: false,
      unread: true,
    };
    
    // 新通知添加到列表頂部
    notifications.unshift(notification);
    
    // 限制通知數量（最多保留 100 條）
    const trimmedNotifications = notifications.slice(0, 100);
    
    localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(trimmedNotifications));
    
    // 觸發事件通知 Notice 頁面更新
    window.dispatchEvent(new CustomEvent('notification-added', { detail: notification }));
  } catch (e) {
    console.warn('Failed to save toast as notification', e);
  }
}

// 命名匯出 useToast
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

// 命名匯出 ToastProvider
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const timersRef = useRef({});
  const remainingRef = useRef({});
  const startRef = useRef({});

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
      timersRef.current = {};
    };
  }, []);

  const addToast = ({ type = 'info', title = '', message = '', autoDismiss = DEFAULT_AUTO_DISMISS }) => {
    const id = ++idRef.current;
    // 將 isExiting 狀態加入 toast 物件中，用於離場動畫
    setToasts(t => [...t, { id, type, title, message, autoDismiss, isExiting: false }]);
    
    if (autoDismiss) {
      startRef.current[id] = Date.now();
      remainingRef.current[id] = autoDismiss;
      timersRef.current[id] = setTimeout(() => removeToast(id), autoDismiss);
    }
    
    // 保存到通知列表（localStorage）
    saveToastAsNotification({ id, type, title, message });
    
    // 廣播事件，讓 NotificationProvider 可以將此 toast 同步寫入後端通知
    try {
      window.dispatchEvent(new CustomEvent('toast-fired', { detail: { id, type, title, message, autoDismiss } }));
    } catch (e) {
      // ignore
    }
    return id;
  };

  const removeToast = (id) => {
    // 設置 isExiting 標記，觸發離場動畫
    setToasts(prevToasts =>
      prevToasts.map(t => (t.id === id ? { ...t, isExiting: true } : t))
    );

    // 等待離場動畫結束後再從 state 中移除
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id));
      if (timersRef.current[id]) { clearTimeout(timersRef.current[id]); delete timersRef.current[id]; }
      delete remainingRef.current[id];
      delete startRef.current[id];
    }, 400); // 動畫時間 (需與 CSS 中的 animate-toast-exit 時間同步)
  };

  const pauseToast = (id) => {
    if (!timersRef.current[id] || !startRef.current[id]) return; // 確保有計時器和開始時間
    const elapsed = Date.now() - startRef.current[id];
    remainingRef.current[id] = Math.max(0, (remainingRef.current[id] || 0) - elapsed);
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
  };

  const resumeToast = (id) => {
    if (timersRef.current[id] || !remainingRef.current[id]) return; // 如果計時器已存在或沒有剩餘時間
    const rem = remainingRef.current[id];
    if (rem <= 0) { // 如果剩餘時間 <= 0，直接移除
      removeToast(id);
      return;
    }
    startRef.current[id] = Date.now();
    timersRef.current[id] = setTimeout(() => removeToast(id), rem);
  };
  
  useEffect(() => {
    const handler = (e) => { const id = e?.detail?.id; if (id) removeToast(id); };
    window.addEventListener('fancy-toast-remove', handler);
    return () => window.removeEventListener('fancy-toast-remove', handler);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} pauseToast={pauseToast} resumeToast={resumeToast} />
    </ToastContext.Provider>
  );
}

// =================================================================================
// ✨ 美化後的 ToastContainer & ToastItem 元件 (符合新樣式)
// =================================================================================

// 圖示顏色和背景顏色
const ICON_COLORS = {
  success: 'text-green-600 bg-green-50',
  error: 'text-red-600 bg-red-50',
  warning: 'text-amber-600 bg-amber-50',
  info: 'text-blue-600 bg-blue-50',
};

// 進度條顏色
const PROGRESS_COLORS = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

// 圖示 SVG (保持不變，或可替換為 Iconify 等)
const ICONS = {
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),
  info: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
};

function ToastItem({ toast, onRemove, onPause, onResume }) {
  const { id, type, title, message, autoDismiss, isExiting } = toast;
  const progressRef = useRef(null);

  useEffect(() => {
    // 當 Toast 重新渲染時，如果它不是正在離場，重設動畫 (因為 hover 暫停後重啟需要重新觸發動畫)
    if (progressRef.current && autoDismiss && !isExiting) {
      progressRef.current.style.animation = 'none'; // 先清除動畫
      void progressRef.current.offsetWidth; // 觸發 reflow
      progressRef.current.style.animation = `toast-progress ${autoDismiss}ms linear forwards`;
    }
  }, [autoDismiss, isExiting, toast]); // 監聽 autoDismiss 或 toast 變化

  // 根據 autoDismiss 狀態動態調整進度條動畫
  const handleMouseEnter = () => {
    onPause(id);
    if (progressRef.current) {
      progressRef.current.style.animationPlayState = 'paused';
    }
  };

  const handleMouseLeave = () => {
    onResume(id);
    if (progressRef.current) {
      progressRef.current.style.animationPlayState = 'running';
    }
  };

  return (
    <div
      className={`toast-item ${isExiting ? 'animate-toast-exit' : 'animate-toast-enter'} 
                 relative max-w-sm rounded-xl bg-white/70 backdrop-blur-md ring-1 ring-black/5 
                 text-zinc-900 overflow-hidden flex flex-col`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-start p-4 pr-3"> {/* 調整 padding-right 讓關閉按鈕有空間 */}
        {/* 圖示區域 */}
        <div className={`flex-shrink-0 flex items-center justify-center rounded-full ${ICON_COLORS[type]} p-2`}>
          {ICONS[type]}
        </div>

        {/* 文字內容區域 */}
        <div className="ml-3 flex-1">
          {title && <p className="text-sm font-bold">{title}</p>} {/* 標題粗體 */}
          <p className={`mt-1 text-sm ${title ? 'text-zinc-700' : 'text-zinc-900'}`}>{message}</p>
        </div>
        
      </div>

      {/* 進度條 (細線條在底部) */}
      {autoDismiss > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1">
          <div
            ref={progressRef}
            className={`h-full ${PROGRESS_COLORS[type]}`}
            style={{ animation: `toast-progress ${autoDismiss}ms linear forwards` }}
          />
        </div>
      )}
    </div>
  );
}

function ToastContainer({ toasts = [], removeToast, pauseToast, resumeToast }) {
  return (
    <div aria-live="assertive" className="pointer-events-none fixed inset-0 flex items-start px-4 py-6 sm:p-6 z-[9999]">
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} onPause={pauseToast} onResume={resumeToast} />
        ))}
      </div>
    </div>
  );
}