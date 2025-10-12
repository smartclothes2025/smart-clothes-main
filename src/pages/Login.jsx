// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; // 路徑依實際檔案
import { signInWithEmailAndPassword } from "firebase/auth";

const FIREBASE_ERROR_MAP = {
  'auth/invalid-credential': '帳號或密碼錯誤',
  'auth/wrong-password': '帳號或密碼錯誤',
  'auth/user-not-found': '帳號或密碼錯誤',
  'auth/invalid-email': '請輸入有效電子郵件',
  // 其他可擴充
};

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false); // 記住我
  const navigate = useNavigate();

  // 讀 localStorage（若先前有儲存帳密就 prefill）
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rememberCredentials');
      if (saved === 'true') {
        const savedUser = localStorage.getItem('savedUsername') || '';
        const savedPass = localStorage.getItem('savedPassword') || '';
        setUsername(savedUser);
        setPassword(savedPass);
        setRemember(true);
      }
    } catch (e) {
      console.warn('讀取 localStorage 失敗', e);
    }

    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // 當 remember checkbox 改變：如果勾選就立刻存當前帳密；取消就移除儲存
  const handleRememberToggle = (checked) => {
    setRemember(checked);
    try {
      if (checked) {
        localStorage.setItem('rememberCredentials', 'true');
        localStorage.setItem('savedUsername', username || '');
        localStorage.setItem('savedPassword', password || '');
      } else {
        localStorage.removeItem('rememberCredentials');
        localStorage.removeItem('savedUsername');
        localStorage.removeItem('savedPassword');
      }
    } catch (e) {
      console.warn('LocalStorage 儲存失敗：', e);
    }
  };

  // 當 username/password 改變，如果目前有勾選 remember，就同步更新儲存的帳密
  useEffect(() => {
    if (remember) {
      try {
        localStorage.setItem('savedUsername', username);
        localStorage.setItem('savedPassword', password);
      } catch (e) {
        console.warn('LocalStorage 儲存失敗：', e);
      }
    }
  }, [username, password, remember]);

  const handleFirebaseLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      // 取得 idToken，若你沒有 custom claim 更新的需求改成 getIdToken()
      const idToken = await userCredential.user.getIdToken(true);

  console.log("[Firebase] ID Token (truncated):", idToken?.slice ? idToken.slice(0, 40) + '...' : idToken);

      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({}),
      });

      console.log("[Backend] HTTP Status:", response.status);

      let data = null;
      try {
        data = await response.json();
      } catch (jsonErr) {
        console.warn("[Backend] 無法解析 JSON:", jsonErr);
      }

      if (!response.ok) {
        console.error("[Backend] Response Data:", data);
        const serverMsg = data?.detail || data?.message || data?.error || `登入失敗，HTTP ${response.status}`;
        throw new Error(serverMsg);
      }

      console.log("[Backend] Response Data:", data);

      const userFromBackend = data?.user || {};
      const role = userFromBackend.role || 'user';

      // 儲存 token 與 user（便於其他 request）
      if (onLogin) onLogin({ token: data?.token || '', user: userFromBackend });
      try {
        if (data?.token) localStorage.setItem('token', data.token);
        if (userFromBackend) localStorage.setItem('user', JSON.stringify(userFromBackend));
      } catch (e) {
        console.warn("LocalStorage 儲存失敗：", e);
      }

      // 如果勾選記住我，確認已儲存帳密（前面已有處理）
      if (remember) {
        try {
          localStorage.setItem('rememberCredentials', 'true');
          localStorage.setItem('savedUsername', username);
          localStorage.setItem('savedPassword', password);
        } catch (e) {
          console.warn('LocalStorage 儲存失敗：', e);
        }
      }

      // 導頁
      if (role === 'admin') {
        navigate('/admin/Dashboard', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }

    } catch (err) {
      console.error("[Error] 登入失敗:", err);

      // Firebase 的錯誤（例如 auth/invalid-credential）通常會有 err.code
      let friendly = '登入發生錯誤';
      try {
  const code = err?.code || (err?.message?.includes('auth/') ? err.message.split(':')[0] : null);
        if (code && FIREBASE_ERROR_MAP[code]) {
          friendly = FIREBASE_ERROR_MAP[code];
        } else if (err?.message) {
          // 若伺服器回傳像 "auth/invalid-credential" 的字串在 message 中，也處理
          const msg = err.message;
          const found = Object.keys(FIREBASE_ERROR_MAP).find(k => msg.includes(k));
          if (found) friendly = FIREBASE_ERROR_MAP[found];
          else friendly = err.message;
        }
      } catch (e) {
        console.warn('解析錯誤訊息時發生例外：', e);
        friendly = err?.message || e?.message || '登入發生錯誤';
      }

      // 顯示給使用者的錯誤 (中文)
      setError(friendly);
      throw new Error(friendly); // 保持原本外層 catch 也能捕捉到
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('請填寫帳號與密碼');
      return;
    }

    setSubmitting(true);
    try {
      await handleFirebaseLogin();
    } catch (err) {
      // handleFirebaseLogin 內會 setError，這裡可做補充動作或記錄
      console.warn('handleSubmit catch:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // 訪客登入（保留原邏輯）
  const handleGuestLogin = async () => {
    setError('');
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      const fake = {
        token: 'guest-token-000',
        user: { id: 99, name: '訪客', email: 'guest@local', role: 'user' },
      };
      if (onLogin) onLogin({ token: fake.token, user: fake.user });
      try {
        localStorage.setItem('token', fake.token);
        localStorage.setItem('user', JSON.stringify(fake.user));
      } catch (e) {
        console.warn('LocalStorage 儲存失敗：', e);
      }
      navigate('/home', { replace: true });
    } catch (err) {
      console.error(err);
      setError('訪客登入失敗');
    } finally {
      setSubmitting(false);
    }
  };

  // 臨時後台登入（僅供測試使用）
  const handleTempAdminLogin = async () => {
    setError('');
    setSubmitting(true);
    try {
      // 模擬延遲
      await new Promise((r) => setTimeout(r, 200));
      const fake = {
        token: 'admin-token-temp-000',
        user: {
          id: 'admin-1',
          name: '臨時管理員',
          email: 'admin@local',
          role: 'admin',
        },
      };

      // 觸發上層狀態
      if (onLogin) onLogin({ token: fake.token, user: fake.user });

      // 儲存至 localStorage 供後續請求使用
      try {
        localStorage.setItem('token', fake.token);
        localStorage.setItem('user', JSON.stringify(fake.user));
      } catch (e) {
        console.warn('LocalStorage 儲存失敗：', e);
      }

      // 導向後台儀表板
      navigate('/admin/Dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      setError('臨時後台登入失敗');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login">
      <div
        className={`
          relative flex flex-col m-6 bg-white shadow-2xl rounded-2xl md:flex-row md:space-y-0 w-full max-w-4xl
          transition-all duration-1000 ease-in-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}
      >
        <div className="w-full md:w-1/2">
          <div className="p-8 md:p-6">
            <h1 className="mb-3 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-green-600">
              歡迎回來
            </h1>
            <p className="mb-4 text-sm text-gray-600">請登入您的帳戶</p>

            <form onSubmit={handleSubmit} className="space-y-5" aria-describedby="login-error">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  type="text"
                  name="username"
                  id="username"
                  className="w-full p-2 pl-12 border border-gray-200 rounded-lg text-gray-800 placeholder:font-light placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
                  placeholder="使用者名稱或電子郵件"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="w-full p-2 pl-12 border border-gray-200 rounded-lg text-gray-800 placeholder:font-light placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
                  placeholder="請輸入您的密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="flex justify-between items-center text-sm text-gray-800">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="remember"
                    id="remember"
                    className="w-4 h-4 rounded text-green-700 focus:ring-green-600"
                    disabled={submitting}
                    checked={remember}
                    onChange={(e) => handleRememberToggle(e.target.checked)}
                  />
                  <label htmlFor="remember">記住我</label>
                </div>
                <button
                  type="button"
                  className="font-semibold text-amber-600 hover:underline"
                  onClick={() => alert('請聯絡管理員或使用註冊郵件的重設功能')}
                >
                  忘記密碼?
                </button>
              </div>

              {error && (
                <div id="login-error" className="text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-800 to-green-600 text-white p-3 rounded-lg font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? '登入中...' : '登入'}
              </button>
            </form>

            <div className="flex items-center my-5">
              <hr className="flex-grow border-t border-gray-200" />
              <span className="px-4 text-sm text-gray-500">或</span>
              <hr className="flex-grow border-t border-gray-200" />
            </div>

            <div className="space-y-4">
              <button
                type="button"
                className="w-full flex items-center justify-center p-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={submitting}
                onClick={() => {
                  alert('Google OAuth 尚未串接');
                }}
              >
                <img src="/Google.png" alt="Google Logo" className="w-5 h-5 mr-3" />
                <span>使用 Google 帳戶登入</span>
              </button>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full p-3 rounded-lg font-semibold border border-amber-600 text-amber-600 hover:bg-amber-50 hover:text-amber-700 active:bg-amber-100 transition-colors disabled:opacity-60"
                disabled={submitting}
              >
                <span>訪客登入</span>
              </button>

              {/* 臨時後台登入（僅測試環境使用） */}
              <button
                type="button"
                onClick={handleTempAdminLogin}
                className="w-full p-3 rounded-lg font-semibold border border-green-700 text-green-800 hover:bg-green-50 hover:text-green-900 active:bg-green-100 transition-colors disabled:opacity-60"
                disabled={submitting}
                title="僅供開發測試用，正式環境請移除"
              >
                <span>臨時後台登入</span>
              </button>
            </div>

            <div className="text-center text-sm text-gray-500 mt-6">
              還沒有帳戶嗎?{' '}
              <Link to="/register" className="font-semibold text-amber-600 hover:underline">
                立即註冊
              </Link>
            </div>
          </div>
        </div>

        <div className="relative hidden w-full md:w-1/2 md:flex flex-col items-center justify-center p-8">
          <h1 className="mb-4 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-green-600">
            登入
          </h1>
          <img src="/穿搭醬logo.png" alt="穿搭醬 Logo" className="w-auto h-auto max-w-xs" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

LoginPage.propTypes = {
  onLogin: PropTypes.func,
};
