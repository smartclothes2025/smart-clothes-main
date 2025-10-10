// src/pages/Register.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const isValidEmail = (e) => /\S+@\S+\.\S+/.test(e);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !displayName || !password || !confirmPassword) {
      setError('請填寫所有欄位');
      return;
    }
    if (!isValidEmail(email)) {
      setError('請輸入有效的電子郵件地址');
      return;
    }
    if (password.length < 6) {
      setError('密碼至少要 6 個字元');
      return;
    }
    if (password !== confirmPassword) {
      setError('兩次輸入的密碼不一致');
      return;
    }

    setSubmitting(true);

    try {
      // use x-www-form-urlencoded to match backend Form(...)
      const body = new URLSearchParams();
      body.append('email', email);
      body.append('password', password);
      body.append('display_name', displayName);

      // 注意：若你的後端路由為 /api/v1/auth/register/（包含尾 slash）也可通
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!response.ok) {
        let errMsg = `註冊失敗，HTTP ${response.status}`;
        try {
          const errData = await response.json();
          errMsg = errData.detail || errData.message || JSON.stringify(errData);
        } catch (e) { /* 無法 parse */ }
        setError(errMsg);
        return;
      }

      const data = await response.json();
      setSuccessMsg(data.message || '註冊成功，請至登入頁登入');
      // 顯示成功提示後，1 秒導回登入頁（你可以調整時間）
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 5000);

    } catch (err) {
      console.error('註冊失敗：', err);
      setError('註冊發生錯誤，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50 font-sans p-4">
      <div
        className={`
          relative flex flex-col m-6 bg-white shadow-2xl rounded-2xl md:flex-row md:space-y-0 w-full max-w-4xl
          transition-all duration-1000 ease-in-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}
      >
        <div className="w-full md:w-1/2">
          <div className="p-8 md:p-12">
            <h1 className="mb-2 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-green-600">
              建立您的帳戶
            </h1>
            <p className="mb-8 text-sm text-gray-600">只需幾步，即可開始您的智慧穿搭旅程！</p>

            <form onSubmit={handleSubmit} className="space-y-5" aria-describedby="register-error register-success">
              <div className="relative">
                <input
                  type="text"
                  className="w-full p-3 pl-12 border border-gray-200 rounded-lg"
                  name="display_name"
                  placeholder="顯示名稱（例：王小明）"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="relative">
                <input
                  type="email"
                  className="w-full p-3 pl-12 border border-gray-200 rounded-lg"
                  name="email"
                  placeholder="請輸入您的電子郵件"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="relative">
                <input
                  type="password"
                  id="password"
                  className="w-full p-3 pl-12 border border-gray-200 rounded-lg"
                  name="password"
                  placeholder="請設定您的密碼（至少 6 字元）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="relative">
                <input
                  type="password"
                  id="confirmPassword"
                  className="w-full p-3 pl-12 border border-gray-200 rounded-lg"
                  name="confirmPassword"
                  placeholder="請再次確認密碼"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                />
              </div>

              {error && <div id="register-error" className="text-sm text-red-600">{error}</div>}
              {successMsg && <div id="register-success" className="text-sm text-green-600">{successMsg}</div>}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-800 to-green-600 text-white p-3 rounded-lg font-semibold shadow-md disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? '註冊中...' : '註冊帳戶'}
              </button>
            </form>

            <div className="text-center text-sm text-gray-500 mt-10">
              已經有帳戶了?{' '}
              <Link to="/login" className="font-semibold text-amber-600 hover:underline">立即登入</Link>
            </div>
          </div>
        </div>

        <div className="relative hidden w-full md:w-1/2 md:flex flex-col items-center justify-center p-8">
          <h1 className="mb-4 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-green-600">註冊</h1>
          <img src="/穿搭醬logo.png" alt="穿搭醬 Logo" className="w-auto h-auto max-w-xs" />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
