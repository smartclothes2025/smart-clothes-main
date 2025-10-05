import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Google Icon SVG (保持不變)
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.596,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);

// 接收從 App.jsx 傳來的 onLogin 函式
const LoginPage = ({ onLogin }) => { 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate(); // 初始化 navigate 函式

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // --- 主要登入邏輯 ---
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!username || !password) {
      alert('請填寫所有欄位！');
      return;
    }
    console.log('登入資訊:', { username, password });
    alert('登入請求已送出（請查看主控台）');
    
    // 呼叫父元件的 onLogin 函式來更新登入狀態
    if (onLogin) {
      onLogin(); 
    } else {
      // 如果沒有 onLogin prop，作為備用方案直接導航
      // 注意：這可能不會觸發 App.jsx 中的 isLoggedIn 狀態變更
      navigate('/home');
    }
  };
  
  // --- 訪客登入邏輯 ---
  const handleGuestLogin = () => {
    console.log('訪客登入...');
    if (onLogin) {
      onLogin();
      console.log('onLogin called, navigating to /home');
    } else {
      console.log('onLogin not provided, navigating to /home directly');
    }
    navigate('/home');
    setLoginState('login'); // 將登入狀態設置為 'login'
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
        {/* ========== 左側：登入表單 ========== */}
        <div className="w-full md:w-1/2">
          <div className="p-8 md:p-6">
            <h1 className="mb-3 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-green-600">
              歡迎回來
            </h1>
            <p className="mb-4 text-sm text-gray-600">請登入您的帳戶</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  type="text"
                  className="w-full p-2 pl-12 border border-gray-200 rounded-lg text-gray-800 placeholder:font-light placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
                  name="username"
                  placeholder="使用者名稱或電子郵件"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type="password"
                  id="password"
                  className="w-full p-2 pl-12 border border-gray-200 rounded-lg text-gray-800 placeholder:font-light placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
                  name="password"
                  placeholder="請輸入您的密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex justify-between items-center text-sm text-gray-800">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" name="remember" id="remember" className="w-4 h-4 rounded text-green-700 focus:ring-green-600" />
                  <label htmlFor="remember">記住我</label>
                </div>
                <a href="#" className="font-semibold text-amber-600 hover:underline">忘記密碼?</a>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-green-800 to-green-600 text-white p-3 rounded-lg font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-300">
                登入
              </button>
            </form>

            <div className="flex items-center my-5">
              <hr className="flex-grow border-t border-gray-200" />
              <span className="px-4 text-sm text-gray-500">或</span>
              <hr className="flex-grow border-t border-gray-200" />
            </div>
            
            <div className="space-y-4">
              <button className="w-full flex items-center justify-center p-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                <GoogleIcon />
                <span>使用 Google 帳戶登入</span>
              </button>

              {/* --- 綁定 onClick 事件到訪客登入按鈕 --- */}
              <button 
                onClick={handleGuestLogin}
                className="w-full p-3 rounded-lg font-semibold border border-amber-600 text-amber-600 hover:bg-amber-50 hover:text-amber-700 active:bg-amber-100 transition-colors"
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
          <img src="/public/穿搭醬logo.png" alt="穿搭醬 Logo" className="w-auto h-auto max-w-xs" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;