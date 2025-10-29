// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; 
import { signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from '../components/ToastProvider';

const FIREBASE_ERROR_MAP = {
  'auth/invalid-email': '請輸入有效電子郵件',
  'auth/wrong-password': '帳號或密碼錯誤',
  'auth/user-not-found': '帳號或密碼錯誤',
  'auth/too-many-requests': '嘗試次數過多，請稍後再試',
};

const getFriendlyError = (err) => {
  if (!err) return '登入失敗，請稍後再試';
  const raw = (err.message || String(err)).toLowerCase();

  if (raw.includes('failed to fetch') || raw.includes('network') || raw.includes('net::err')) {
    return '網路連線失敗，請檢查網路或後端是否已啟動';
  }
  if (raw.includes('auth/wrong-password') || raw.includes('wrong-password') || raw.includes('invalid-credential') || raw.includes('401')) {
    return '帳號或密碼錯誤';
  }
  if (raw.includes('auth/user-not-found') || raw.includes('user-not-found') || raw.includes('找不到')) {
    return '找不到該帳號';
  }
  if (raw.includes('invalid-email') || raw.includes('email')) {
    return '請輸入有效電子郵件';
  }
  if (raw.includes('too-many-requests')) {
    return '嘗試次數過多，請稍後再試';
  }
  if (raw.includes('timeout')) {
    return '伺服器連線逾時，請稍後再試';
  }
  const maybeDetail = err?.message || err?.detail || err?.toString();
  return maybeDetail || '登入失敗，請稍後再試';
};

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remember, setRemember] = useState(false); // 記住帳號
  const navigate = useNavigate();

  // 使用全域 toast
  const { addToast } = useToast();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rememberCredentials');
      if (saved === 'true') {
        const savedUser = localStorage.getItem('savedUsername') || '';
        setUsername(savedUser);
        setRemember(true);
      }
    } catch (e) {
      console.warn('讀取 localStorage 失敗', e);
    }

    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleRememberToggle = (checked) => {
    setRemember(checked);
    try {
      if (checked) {
        localStorage.setItem('rememberCredentials', 'true');
        localStorage.setItem('savedUsername', username || '');
      } else {
        localStorage.removeItem('rememberCredentials');
        localStorage.removeItem('savedUsername');
      }
    } catch (e) {
      console.warn('LocalStorage 儲存失敗：', e);
    }
  };

  useEffect(() => {
    if (remember) {
      try {
        localStorage.setItem('savedUsername', username);
      } catch (e) {
        console.warn('LocalStorage 儲存失敗：', e);
      }
    }
  }, [username, remember]);

  // 登入流程（Firebase -> backend, fallback backend form）
  const handleFirebaseLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      const idToken = await userCredential.user.getIdToken(true);

      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({}),
      });

      let data = null;
      try { data = await response.json(); } catch (_) { data = null; }

      if (!response.ok) {
        const serverMsg = data?.detail || data?.message || data?.error || `登入失敗（HTTP ${response.status})`;
        throw new Error(serverMsg);
      }

      const userFromBackend = data?.user || {};
      const role = userFromBackend.role || 'user';

      if (onLogin) onLogin({ token: data?.token || '', user: userFromBackend });
      try {
        if (data?.token) localStorage.setItem('token', data.token);
        if (userFromBackend) localStorage.setItem('user', JSON.stringify(userFromBackend));
      } catch (e) { console.warn('LocalStorage 儲存失敗：', e); }

      if (remember) {
        try {
          localStorage.setItem('rememberCredentials', 'true');
          localStorage.setItem('savedUsername', username);
        } catch (e) {}
      }

      addToast({ type: 'success', title: '登入成功', message: `歡迎回來 ${userFromBackend.name || ''}`, autoDismiss: 2500 });

      if (role === 'admin') navigate('/admin/Dashboard', { replace: true });
      else navigate('/home', { replace: true });

      return;
    } catch (err) {
      const code = err?.code;
      if (code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        throw new Error(FIREBASE_ERROR_MAP[code] || getFriendlyError(err));
      }
      console.warn('Firebase 登入失敗或非認證錯誤，轉為後端直接登入：', err);
    }

    // fallback: 後端直接驗證
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email: username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.message || data.error || `登入失敗（HTTP ${response.status})`);
      }

      const userFromBackend = data?.user || {};
      const role = userFromBackend.role || 'user';

      if (onLogin) onLogin({ token: data?.token || '', user: userFromBackend });
      try {
        if (data?.token) localStorage.setItem('token', data.token);
        if (userFromBackend) localStorage.setItem('user', JSON.stringify(userFromBackend));
      } catch (e) {}

      if (remember) {
        try {
          localStorage.setItem('rememberCredentials', 'true');
          localStorage.setItem('savedUsername', username);
        } catch (e) {}
      }

      addToast({ type: 'success', title: '登入成功', message: `歡迎回來 ${userFromBackend.name || ''}`, autoDismiss: 2500 });

      if (role === 'admin') navigate('/admin/Dashboard', { replace: true });
      else navigate('/home', { replace: true });

      return;
    } catch (err) {
      console.error('[Login] 最終錯誤：', err);
      throw new Error(getFriendlyError(err));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      addToast({ type: 'error', title: '欄位不足', message: '請填寫帳號與密碼', autoDismiss: 3500 });
      return;
    }

    setSubmitting(true);
    try {
      await handleFirebaseLogin();
    } catch (err) {
      console.warn('handleSubmit catch:', err);
      addToast({ type: 'error', title: '登入失敗', message: getFriendlyError(err), autoDismiss: 5000 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      // 使用真實的測試使用者 ID
      const testUserId = '9c33c7e9-ce22-4c4d-b385-15504ef368da';
      const fake = {
        token: `user-${testUserId}-token`,
        user: { id: testUserId, name: '測試使用者', email: 'test@local', role: 'user' },
      };
      if (onLogin) onLogin({ token: fake.token, user: fake.user });
      try {
        localStorage.setItem('token', fake.token);
        localStorage.setItem('user', JSON.stringify(fake.user));
      } catch (e) {}
      addToast({ type: 'success', message: '已以訪客身分登入', autoDismiss: 2200 });
      navigate('/home', { replace: true });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: '訪客登入失敗', autoDismiss: 3500 });
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
          <div className="p-8 md:p-8">
            <h1 className="mb-3 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-green-600">
              歡迎回來
            </h1>
            <p className="mb-4 text-sm text-gray-600">請登入您的帳戶</p>

            <form onSubmit={handleSubmit} className="space-y-5" aria-describedby="login-error">
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  id="username"
                  className="form-input w-full"
                  placeholder="使用者名稱或電子郵件"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="relative">
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-input w-full"
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
                  <label htmlFor="remember">記住帳號</label>
                </div>
                <button type="button" onClick={(ev) => { ev.preventDefault(); addToast({ type: 'info', message: '忘記密碼流程尚未串接', autoDismiss: 3000 }); }} className="font-semibold text-amber-600 hover:underline">
                  忘記密碼?
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-800 to-green-600 text-white p-3 rounded-lg font-semibold shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-60"
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
                  addToast({ type: 'info', message: 'Google OAuth 尚未串接', autoDismiss: 3000 });
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
