import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Wardrobe from './pages/Wardrobe';
import Upload from './pages/Upload';
import Assistant from './pages/Assistant';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import './index.css';

export default function App(){
  const [theme, setTheme] = useState('light');
  useEffect(() => { try { document.documentElement.setAttribute('data-theme', theme);} catch(e){} }, [theme]);
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Routes>
          <Route path="/" element={<Home theme={theme} setTheme={setTheme} />} />
          <Route path="/wardrobe" element={<Wardrobe theme={theme} setTheme={setTheme} />} />
          <Route path="/upload" element={<Upload theme={theme} setTheme={setTheme} />} />
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
