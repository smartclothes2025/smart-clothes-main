// src/components/FancyToast.jsx
import React, { useState, useRef, useEffect } from 'react';

/**
 * useFancyToast()
 * 回傳 { addToast, ToastContainer }
 *
 * addToast({ type, title, message, autoDismiss })
 * ToastContainer 為 React 元件，放在 App 或頁面內即可顯示 Toast
 */

const DEFAULT_AUTO_DISMISS = 4200;

export function useFancyToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const timersRef = useRef({});
  const remainingRef = useRef({});
  const startRef = useRef({});

  useEffect(() => {
    return () => {
      // 清除所有定時器
      Object.values(timersRef.current).forEach((t) => clearTimeout(t));
      timersRef.current = {};
    };
  }, []);

  const addToast = ({ type = 'info', title = '', message = '', autoDismiss = DEFAULT_AUTO_DISMISS }) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, type, title, message, autoDismiss }]);

    // 初始化計時
    startRef.current[id] = Date.now();
    remainingRef.current[id] = autoDismiss;

    timersRef.current[id] = setTimeout(() => {
      removeToast(id);
    }, autoDismiss);

    return id;
  };

  const removeToast = (id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    delete remainingRef.current[id];
    delete startRef.current[id];
  };

  const pauseToast = (id) => {
    if (!timersRef.current[id]) return;
    const elapsed = Date.now() - (startRef.current[id] || 0);
    const rem = Math.max(0, (remainingRef.current[id] || 0) - elapsed);
    remainingRef.current[id] = rem;
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
  };

  const resumeToast = (id) => {
    const rem = remainingRef.current[id] ?? 0;
    if (rem <= 0) {
      removeToast(id);
      return;
    }
    startRef.current[id] = Date.now();
    timersRef.current[id] = setTimeout(() => {
      removeToast(id);
    }, rem);
  };

  // 支援由內部關閉按鈕發送事件來刪除
  useEffect(() => {
    const handler = (e) => {
      const id = e?.detail?.id;
      if (id) removeToast(id);
    };
    window.addEventListener('fancy-toast-remove', handler);
    return () => window.removeEventListener('fancy-toast-remove', handler);
  }, []);

  const ToastContainer = () => (
    <>
      <style>{`
        @keyframes fancyFloat {
          0% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0); }
        }
        @keyframes progressBar {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes popIn {
          from { transform: translateY(-8px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>

      <div aria-live="polite" className="pointer-events-none fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-xs">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`
              pointer-events-auto overflow-hidden rounded-2xl backdrop-blur-md
              border border-white/30 bg-white/60 shadow-2xl
              transform transition-all duration-250 ease-out
              animate-[popIn_200ms_ease_out]
            `}
            onMouseEnter={() => pauseToast(t.id)}
            onMouseLeave={() => resumeToast(t.id)}
          >
            <div className="flex gap-3 items-start p-3">
              <div className="flex-none mt-0.5">
                {t.type === 'error' ? (
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-red-100/80 border border-red-200 shadow-sm" style={{ animation: 'fancyFloat 2.2s ease-in-out infinite' }}>
                    <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M12 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="currentColor" opacity="0.06"/>
                    </svg>
                  </div>
                ) : t.type === 'success' ? (
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-green-100/80 border border-green-200 shadow-sm" style={{ animation: 'fancyFloat 2.2s ease-in-out infinite' }}>
                    <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ) : (
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100/80 border border-blue-200 shadow-sm" style={{ animation: 'fancyFloat 2.2s ease-in-out infinite' }}>
                    <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M13 16h-1v-4h-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {t.title && <div className={`text-sm font-semibold ${t.type === 'error' ? 'text-red-700' : t.type === 'success' ? 'text-green-700' : 'text-gray-800'}`}>{t.title}</div>}
                <div className="mt-0.5 text-sm text-gray-700 break-words">{t.message}</div>

                <div className="mt-3 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-1 bg-amber-400"
                    style={{
                      width: '100%',
                      animation: `progressBar ${t.autoDismiss || DEFAULT_AUTO_DISMISS}ms linear forwards`,
                      transformOrigin: 'left',
                    }}
                  />
                </div>
              </div>

              <div className="flex-none ml-2">
                <button
                  onClick={() => {
                    const evt = new CustomEvent('fancy-toast-remove', { detail: { id: t.id } });
                    window.dispatchEvent(evt);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400"
                  aria-label="關閉通知"
                  type="button"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return { addToast, ToastContainer, removeToast, pauseToast, resumeToast };
}
