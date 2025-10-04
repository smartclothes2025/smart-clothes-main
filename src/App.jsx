import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Header from './components/Header'; 
import Home from './pages/Home';
import Wardrobe from './pages/Wardrobe';
import Upload from './pages/Upload';
import Assistant from './pages/Assistant';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Post from "./pages/Post";
import './index.css';

export default function App(){
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {}
  }, [theme]);

  return (
    <BrowserRouter>
      <Header title="穿搭醬" theme={theme} setTheme={setTheme} />
  <div className="min-h-full bg-gradient-to-b from-gray-50 to-white pt-12 pb-24 md:pb-0">
        <Routes>
          <Route path="/" element={<Home theme={theme} setTheme={setTheme} />} />
          <Route path="/wardrobe" element={<Wardrobe theme={theme} setTheme={setTheme} />} />
          <Route path="/upload" element={<Upload theme={theme} setTheme={setTheme} />} />
          <Route path="/post" element={<Post theme={theme} setTheme={setTheme} />} />
          <Route path="/assistant" element={<Assistant theme={theme} setTheme={setTheme} />} />
          <Route path="/profile" element={<Profile theme={theme} setTheme={setTheme} />} />
          <Route path="/settings" element={<Settings theme={theme} setTheme={setTheme} />} />
          <Route path="/recommend" element={<Assistant theme={theme} setTheme={setTheme} />} />
        </Routes>

        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
