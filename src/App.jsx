import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import BottomNav from './components/BottomNav';
import Header from './components/Header';

import Home from './pages/Home';
import Wardrobe from './pages/Wardrobe';
import Upload from './pages/Upload';
import UploadSelect from './pages/UploadSelect';
import UploadEdit from './pages/UploadEdit';
import Assistant from './pages/Assistant';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Post from './pages/Post';
import Login from './pages/Login';
import Register from './pages/Register';
import './index.css';

export default function App() {
  const [theme, setTheme] = useState('light');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
    }
  }, [theme]);

  // 啟動時從 localStorage 檢查是否已登入
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  // 登入成功後呼叫（Login 頁會把 token 存起來再呼叫這個）
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  //未登入則導回登入頁
  const RequireAuth = ({ children }) => {
    return isLoggedIn ? children : <Navigate to="/" replace />;
  };

  return (
    <BrowserRouter>
      {isLoggedIn && <Header theme={theme} setTheme={setTheme} />}

      <div>
        <Routes>
          {/* 登入頁 */}
          <Route path="/" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />

          {/* 登入後才能進入 */}
          <Route
            path="/home"
            element={
              <RequireAuth>
                <Home theme={theme} setTheme={setTheme} />
              </RequireAuth>
            }
          />
          <Route
            path="/wardrobe"
            element={
              <RequireAuth>
                <Wardrobe theme={theme} setTheme={setTheme} />
              </RequireAuth>
            }
          />
          <Route
            path="/upload"
            element={
              <RequireAuth>
                <Upload theme={theme} setTheme={setTheme} />
              </RequireAuth>
            }
          />
          <Route
            path="/upload/select"
            element={
              <RequireAuth>
                <UploadSelect theme={theme} setTheme={setTheme} />
              </RequireAuth>
            }
          />
          <Route
            path="/upload/edit"
            element={
              <RequireAuth>
                <UploadEdit theme={theme} setTheme={setTheme} />
              </RequireAuth>
            }
          />
          <Route
            path="/post"
            element={
              <RequireAuth>
                <Post theme={theme} setTheme={setTheme} />
              </RequireAuth>
            }
          />
          <Route
            path="/assistant"
            element={
              <RequireAuth>
                <Assistant theme={theme} setTheme={setTheme} />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile theme={theme} setTheme={setTheme} />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                {/* 把 setIsLoggedIn 傳進 Settings，讓登出能改變登入狀態 */}
                <Settings
                  theme={theme}
                  setTheme={setTheme}
                  setIsLoggedIn={setIsLoggedIn}
                />
              </RequireAuth>
            }
          />
          <Route
            path="/recommend"
            element={
              <RequireAuth>
                <Assistant theme={theme} setTheme={setTheme} />
              </RequireAuth>
            }
          />

          {/* 未知路徑導回登入或首頁 */}
          <Route
            path="*"
            element={
              isLoggedIn ? <Navigate to="/home" replace /> : <Navigate to="/" replace />
            }
          />
        </Routes>
        {isLoggedIn && <BottomNav />}
      </div>
    </BrowserRouter>
  );
}
