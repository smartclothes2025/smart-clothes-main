import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  // 動態載入效果
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // 表單提交邏輯
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email || !password || !confirmPassword) {
      alert('請填寫所有欄位！');
      return;
    }
    if (password !== confirmPassword) {
      alert('兩次輸入的密碼不一致！');
      return;
    }
    // 在這裡，您會將註冊資訊送到後端
    console.log('註冊資訊:', { email, password });
    alert('註冊請求已送出（請查看主控台）');
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
        {/* ========== 左側：註冊表單 ========== */}
        <div className="w-full md:w-1/2">
          <div className="p-8 md:p-12">
            <h1 className="mb-2 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-green-600">
              建立您的帳戶
            </h1>
            <p className="mb-8 text-sm text-gray-600">只需幾步，即可開始您的智慧穿搭旅程！</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* --- 電子郵件輸入框 --- */}
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  className="w-full p-3 pl-12 border border-gray-200 rounded-lg text-gray-800 placeholder:font-light placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
                  name="email"
                  placeholder="請輸入您的電子郵件"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* --- 密碼輸入框 --- */}
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type="password"
                  id="password"
                  className="w-full p-3 pl-12 border border-gray-200 rounded-lg text-gray-800 placeholder:font-light placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
                  name="password"
                  placeholder="請設定您的密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* --- 確認密碼輸入框 --- */}
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <input
                  type="password"
                  id="confirmPassword"
                  className="w-full p-3 pl-12 border border-gray-200 rounded-lg text-gray-800 placeholder:font-light placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
                  name="confirmPassword"
                  placeholder="請再次確認密碼"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-green-800 to-green-600 text-white p-3 rounded-lg font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-300">
                註冊帳戶
              </button>
            </form>

            <div className="text-center text-sm text-gray-500 mt-10">
              已經有帳戶了?{' '}
              <Link to="/login" className="font-semibold text-amber-600 hover:underline">
                立即登入
              </Link>
            </div>
          </div>
        </div>

        {/* ========== 右側：裝飾圖片 (手機版會自動隱藏) ========== */}
        <div className="relative hidden w-full md:w-1/2 md:flex flex-col items-center justify-center p-8">
          <img
            src="https://images.unsplash.com/photo-1552010099-5343440bACf3?auto=format&fit=crop&q=80"
            alt="Register page decorative image"
            className="w-full h-full object-cover rounded-r-2xl"
          />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;