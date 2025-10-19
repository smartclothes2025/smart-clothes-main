// src/pages/Settings.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeSelect from '../components/ThemeSelect';
import { Bell } from 'lucide-react';
import Layout from '../components/Layout';

const Row = ({ children, onClick, disabled }) => (
  <div
    onClick={disabled ? undefined : onClick}
    className={`flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:bg-gray-50 cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) onClick && onClick(); }}
  >
    <div>{children}</div>
    <div className="text-gray-400">›</div>
  </div>
);

export default function Settings({ theme, setTheme, setIsLoggedIn, setUser, onLogout }) {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // 1) 清除可能的本地儲存（包含 token、user、refresh token 等）
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');

      // 2) 如果父元件提供 onLogout callback，優先呼叫它（可做 server 登出/撤銷 refresh token）
      if (typeof onLogout === 'function') {
        try {
          // 若 onLogout 為同步或回傳 promise 都可支援
          await onLogout();
        } catch (err) {
          // 若 onLogout 失敗，不中斷本地登出流程，但記錄錯誤
          console.error('onLogout callback error:', err);
        }
      }

      // 3) 更新父層 state（如果有傳入）
      if (typeof setIsLoggedIn === 'function') setIsLoggedIn(false);
      if (typeof setUser === 'function') setUser(null);

      // 4) 發出全域事件，讓其他元件可監聽並做清理
      window.dispatchEvent(new Event('logout'));

      // 5) 導回登入頁（replace 避免回上一頁）
      nav('/', { replace: true });

    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="設定" theme={theme} setTheme={setTheme}>
      <div className="page-wrapper">
        <div className="app-max px-2 mt-2 space-y-4">
          <div />
          <Row onClick={() => nav('/notice')}>
            通知
          </Row>

          <Row onClick={() => {}}>
            收藏的穿搭
          </Row>

          <Row onClick={() => {}}>
            收藏的貼文
          </Row>

          <Row onClick={() => {}}>
            帳號設定
          </Row>

          <Row onClick={() => nav('/contact')}>
            聯絡我們
          </Row>

          <Row onClick={() => {}}>
            <div className="w-full flex items-center justify-between gap-3">
              <span>切換主題</span>
              <ThemeSelect theme={theme} setTheme={setTheme} />
            </div>
          </Row>

          <Row onClick={handleLogout} disabled={loading}>
            <span className={`${loading ? 'text-gray-500' : 'text-red-600'}`}>{loading ? '登出中...' : '登出'}</span>
          </Row>

          <br />
        </div>
      </div>
    </Layout>
  );
}
