import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Palette } from 'lucide-react';

const API_BASE = import.meta.env?.VITE_API_BASE || "https://cometical-kyphotic-deborah.ngrok-free.dev";

// 色系配置
const COLOR_PALETTES = {
  neutral: {
    name: '中性',
    colors: ['#F5F5F5', '#D3D3D3', '#808080', '#2F4F4F'],
    description: '簡約優雅的中性色系'
  },
  khaki: {
    name: '卡其棕',
    colors: ['#F0E68C', '#DAA520', '#CD853F', '#8B4513'],
    description: '溫暖舒適的大地色系'
  },
  blue: {
    name: '藍',
    colors: ['#87CEEB', '#4169E1', '#00008B', '#000080'],
    description: '清爽沉靜的藍色系'
  },
  pink: {
    name: '紅粉',
    colors: ['#FFB6C1', '#FF69B4', '#FF1493', '#C71585'],
    description: '溫柔浪漫的粉紅系'
  },
  green: {
    name: '綠',
    colors: ['#90EE90', '#32CD32', '#228B22', '#006400'],
    description: '清新自然的綠色系'
  }
};

const GENDERS = ['女生', '男生'];

export default function OutfitProposal() {
  const [selectedColor, setSelectedColor] = useState('neutral');
  const [selectedGender, setSelectedGender] = useState('女生');
  const [wishlist, setWishlist] = useState(new Set());

  // 預設使用者性別
  useEffect(() => {
    const fetchUserGender = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${API_BASE}/users/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setSelectedGender(data.gender || '女生');
        }
      } catch (err) {
        console.error('獲取用戶性別失敗:', err);
      }
    };

    fetchUserGender();
  }, []);

  // 切換願望清單
  const toggleWishlist = (itemId) => {
    const newWishlist = new Set(wishlist);
    if (newWishlist.has(itemId)) {
      newWishlist.delete(itemId);
    } else {
      newWishlist.add(itemId);
    }
    setWishlist(newWishlist);
  };

  // 跳轉到購買
  const goToShop = (itemName) => {
    window.open(`https://styleshop-delta.vercel.app/women.html?search=${encodeURIComponent(itemName)}`, '_blank');
  };

  // 設置為主色
  const setAsMainColor = (colorKey) => {
    console.log(`設置 ${COLOR_PALETTES[colorKey].name} 為主色`);
    // 可以在這裡添加保存到後端的邏輯
  };

  return (
    <div className="w-full space-y-6">

      {/* 性別切換 */}
      <div className="flex justify-center gap-3">
        {GENDERS.map(gender => (
          <button
            key={gender}
            onClick={() => setSelectedGender(gender)}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              selectedGender === gender
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {gender}
          </button>
        ))}
      </div>

      {/* 色系選擇 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
          <button
            key={key}
            onClick={() => setSelectedColor(key)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedColor === key
                ? 'border-indigo-600 shadow-lg'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex gap-1 mb-3">
              {palette.colors.map((color, idx) => (
                <div
                  key={idx}
                  className="flex-1 h-8 rounded"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <p className="font-semibold text-gray-800 text-sm">{palette.name}</p>
            <p className="text-xs text-gray-600 mt-1">{palette.description}</p>
          </button>
        ))}
      </div>

      {/* 選中色系的詳細展示 */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-6 h-6 text-indigo-600" />
          <h3 className="text-xl font-bold text-gray-800">
            {COLOR_PALETTES[selectedColor].name}色系搭配建議
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {COLOR_PALETTES[selectedColor].colors.map((color, idx) => (
            <div key={idx} className="text-center">
              <div
                className="w-full h-24 rounded-lg shadow-md mb-2"
                style={{ backgroundColor: color }}
              />
              <p className="text-xs text-gray-600 font-mono">{color}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => goToShop(COLOR_PALETTES[selectedColor].name)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-md"
          >
            <ShoppingBag className="w-5 h-5" />
            去 Style Shop 看同款
          </button>
          <button
            onClick={() => toggleWishlist(selectedColor)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              wishlist.has(selectedColor)
                ? 'bg-red-100 text-red-600 border border-red-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            <Heart className={`w-5 h-5 ${wishlist.has(selectedColor) ? 'fill-current' : ''}`} />
            {wishlist.has(selectedColor) ? '已加入願望清單' : '加入願望清單'}
          </button>
          <button
            onClick={() => setAsMainColor(selectedColor)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all shadow-md"
          >
            <Palette className="w-5 h-5" />
            以此為主色
          </button>
        </div>
      </div>
    </div>
  );
}
