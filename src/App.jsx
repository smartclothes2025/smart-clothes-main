import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ToastProvider';
// 使用者頁面
import Home from './pages/Home';
import Wardrobe from './pages/Wardrobe';
import Upload from './pages/Upload';
import UploadSelect from './pages/UploadSelect';
import UploadEdit from './pages/UploadEdit';
import Assistant from './pages/Assistant';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Post from './pages/Post';
import PostDetail from './pages/PostDetail';

import Login from './pages/Login';
import Register from './pages/Register';
import VirtualFitting from './pages/VirtualFitting';
import Contact from './pages/Contact';
import Notice from './pages/Notice';
import './index.css';

// 後臺頁面
import AdminDashboard from './admin/Dashboard';
import AdminUsers from './admin/Users';
import AdminSettings from './admin/Settings';
import AdminClothes from './admin/Clothes';
import AdminPosts from './admin/Posts';

export default function App() {
  const [theme, setTheme] = useState('light');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null); // { id, name, role }

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) { }
  }, [theme]);

  // 啟動時從 localStorage 檢查是否已登入（開發用）
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    setIsLoggedIn(!!token);
    setUser(storedUser);
  }, []);

  // Login 頁登入成功會呼叫此函式：把 token 與 user 存 localStorage 並更新 state
  const handleLogin = ({ token, user }) => {
    if (token) localStorage.setItem('token', token);
    if (user) localStorage.setItem('user', JSON.stringify(user));
    setIsLoggedIn(true);
    setUser(user);
  };

  // Logout helper（Settings 可以呼叫 setIsLoggedIn(false) 並清 localStorage）
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
  };

  // 未登入導回登入頁
  const RequireAuth = ({ children }) => {
    return isLoggedIn ? children : <Navigate to="/" replace />;
  };

  // 權限守門：role 可以是字串或陣列
  const RequireRole = ({ children, role }) => {
    if (!isLoggedIn) return <Navigate to="/" replace />;
    if (!user) return <Navigate to="/" replace />;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role) ? children : <Navigate to="/home" replace />;
  };

  return (
      <ToastProvider>
        <BrowserRouter>
          <div>
            <Routes>
            {/* 登入頁：把 handleLogin 傳入，Login 負責依照 role 導向 */}
            <Route path="/" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />

            {/* 使用者頁面 */}
            <Route path="/home" element={<Home theme={theme} setTheme={setTheme} />} />
            <Route path="/wardrobe" element={<Wardrobe theme={theme} setTheme={setTheme} />} />
            <Route path="/upload" element={<Upload theme={theme} setTheme={setTheme} />} />
            <Route path="/upload/select" element={<UploadSelect theme={theme} setTheme={setTheme} />} />
            <Route path="/upload/edit" element={<UploadEdit theme={theme} setTheme={setTheme} />} />
            <Route path="/post" element={<Post theme={theme} setTheme={setTheme} />} />
            <Route path="/posts/:id" element={<PostDetail />} />   {/* ← 新增：貼文詳情頁 */}
 
            <Route path="/assistant" element={<Assistant theme={theme} setTheme={setTheme} />} />
            <Route path="/profile" element={<Profile theme={theme} setTheme={setTheme} />} />
            <Route path="/settings" element={<Settings theme={theme} setTheme={setTheme} />} />
            <Route path="/virtual-fitting" element={<VirtualFitting theme={theme} setTheme={setTheme} />} />
            <Route path="/contact" element={<Contact theme={theme} setTheme={setTheme} />} />
            <Route path="/notice" element={<Notice theme={theme} setTheme={setTheme} />} />

            {/* 後臺介面 */}
            <Route
              path="/admin/Dashboard"
              element={
                <RequireAuth>
                  <RequireRole role="admin">
                    <AdminDashboard />
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/Users"
              element={
                <RequireAuth>
                  <RequireRole role="admin">
                    <AdminUsers />
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/Posts"
              element={
                <RequireAuth>
                  <RequireRole role="admin">
                    <AdminPosts />
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/Settings"
              element={
                <RequireAuth>
                  <RequireRole role="admin">
                    <AdminSettings />
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/Clothes"
              element={
                <RequireAuth>
                  <RequireRole role="admin">
                    <AdminClothes />
                  </RequireRole>
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

        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}
