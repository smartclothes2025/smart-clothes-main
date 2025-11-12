// src/pages/Register.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const isValidEmail = (e) => /\S+@\S+\.\S+/.test(e);

  const formatServerError = async (response) => {
    let errMsg = `註冊失敗 (HTTP ${response.status})`;
    try {
      const errData = await response.json();
      if (errData) {
        errMsg = errData.detail || errData.message || JSON.stringify(errData);
      }
    } catch (e) {
      // 無法解析 JSON -> 保留預設錯誤訊息
    }
    return errMsg;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !displayName || !password || !confirmPassword) {
      addToast({ type: 'error', title: '欄位不足', message: '請填寫所有欄位以完成註冊。' });
      return;
    }
    if (!isValidEmail(email)) {
      addToast({ type: 'error', title: 'Email 格式錯誤', message: '請輸入有效的電子郵件地址。' });
      return;
    }
    if (password.length < 6) {
      addToast({ type: 'error', title: '密碼太短', message: '密碼至少需要 6 個字元。' });
      return;
    }
    if (password !== confirmPassword) {
      addToast({ type: 'error', title: '密碼不一致', message: '請確認兩次輸入的密碼相同。' });
      return;
    }

    setSubmitting(true);

    try {
      const body = new URLSearchParams();
      body.append('email', email);
      body.append('password', password);
      body.append('display_name', displayName);

      const response = await fetch('https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!response.ok) {
        const errMsg = await formatServerError(response);
        addToast({ type: 'error', title: '註冊失敗', message: errMsg, autoDismiss: 6000 });
        return;
      }

      addToast({
        type: 'success',
        title: '註冊成功！',
        message: `歡迎 ${displayName}！即將為您轉到登入頁面。`,
        autoDismiss: 3500,
      });
      setTimeout(() => {
        navigate('/');
      }, 3500);
      
    } catch (err) {
      console.error('註冊失敗：', err);
      console.error('詳細錯誤資訊:', err.message, err.stack); 
      addToast({
        type: 'error',
        title: '伺服器錯誤',
        message: '註冊時發生預期外的錯誤，請稍後再試。',
        autoDismiss: 6000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50 font-sans p-4">
      <div
        className={`
          relative flex flex-col m-4 bg-white shadow-2xl rounded-2xl md:flex-row md:space-y-0 w-full max-w-4xl
          transition-all duration-1000 ease-in-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}
      >
        <div className="w-full md:w-1/2">
          <div className="p-8 md:p-8">
            <h1 className="mb-2 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-green-600">
              建立您的帳戶
            </h1>
            <p className="mb-8 text-sm text-gray-600">只需幾步，即可開始您的智慧穿搭旅程！</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <input
                type="text"
                className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-300 focus:border-green-300 transition"
                placeholder="使用者名稱"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={submitting}
              />
              <input
                type="email"
                className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-300 focus:border-green-300 transition"
                placeholder="請輸入您的電子郵件"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
              <input
                type="password"
                className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-300 focus:border-green-300 transition"
                placeholder="請設定您的密碼（至少 6 字元）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
              <input
                type="password"
                className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-300 focus:border-green-300 transition"
                placeholder="請再次確認密碼"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
              />
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-800 to-green-600 text-white p-3 rounded-lg font-semibold shadow-md disabled:opacity-60 hover:from-green-700 hover:to-green-500 transition-all duration-300"
                disabled={submitting}
              >
                {submitting ? '註冊中...' : '註冊帳戶'}
              </button>
            </form>

            <div className="text-center text-sm text-gray-500 mt-6">
              已經有帳戶了?{' '}
              <Link to="/" className="font-semibold text-amber-600 hover:underline">立即登入</Link>
            </div>
          </div>
        </div>

        <div className="relative hidden w-full md:w-1/2 md:flex flex-col items-center justify-center p-8">
          <h1 className="mb-4 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-green-600">
            註冊
          </h1>
          <img src="/穿搭醬logo.png" alt="穿搭醬 Logo" className="w-auto h-auto max-w-xs" />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;