// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

const handleSubmit = async (event) => {
  event.preventDefault();
  setError('');
  if (!username || !password) {
    setError('請填寫帳號與密碼');
    return;
  }

  setSubmitting(true);

  try {
    const response = await fetch('http://127.0.0.1:8000/api/v1/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errData = await response.json();
      setError(errData.detail || '登入失敗，請確認帳號密碼');
      return;
    }

    const data = await response.json();
    // 假設後端回傳格式 { token: 'xxx', user: { id, name, email, role } }

    if (onLogin) {
      onLogin({ token: data.token, user: data.user });
    }

    if (data.user.role === 'admin') {+
      navigate('/admin/Dashboard', { replace: true });
    } else {
      navigate('/home', { replace: true });
    }
  } catch (err) {
    console.error('登入失敗：', err);
    setError('登入發生錯誤，請稍後再試');
  } finally {
    setSubmitting(false);
  }
};

  // 訪客登入：建立一個臨時 user（role: 'user' 或 'guest'）
  const handleGuestLogin = async () => {
    setError('');
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 200)); // 模擬延遲
      const fake = {
        token: 'guest-token-000',
        user: { id: 99, name: '訪客', email: 'guest@local', role: 'user' },
      };
      if (onLogin) onLogin({ token: fake.token, user: fake.user });
      navigate('/home', { replace: true });
    } catch (err) {
      console.error(err);
      setError('訪客登入失敗');
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
                  <input type="checkbox" name="remember" id="remember" className="w-4 h-4 rounded text-green-700 focus:ring-green-600" disabled={submitting} />
                  <label htmlFor="remember">記住我</label>
                </div>
                <a href="#" className="font-semibold text-amber-600 hover:underline">忘記密碼?</a>
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
                  // 這裡做 Google OAuth 流程（開發時先留空或導向 /auth/google）
                  // window.location.href = '/auth/google';
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
