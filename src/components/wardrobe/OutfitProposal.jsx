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
  const [activeTab, setActiveTab] = useState('daily-color');
  const [selectedColor, setSelectedColor] = useState('neutral');
  const [selectedGender, setSelectedGender] = useState('女生');
  const [userGender, setUserGender] = useState(null);
  const [wishlist, setWishlist] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [outfitRecommendations, setOutfitRecommendations] = useState([]);

  // 獲取用戶性別
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
          setUserGender(data.gender || '女生');
          setSelectedGender(data.gender || '女生');
        }
      } catch (err) {
        console.error('獲取用戶性別失敗:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserGender();
  }, []);

  // 獲取穿搭推薦
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${API_BASE}/outfits/recommendations?gender=${selectedGender}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setOutfitRecommendations(data);
        }
      } catch (err) {
        console.error('獲取穿搭推薦失敗:', err);
      }
    };

    if (activeTab === 'wardrobe-outfit') {
      fetchRecommendations();
    }
  }, [activeTab, selectedGender]);

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
    <div className="w-full">
      {/* 分頁標籤 */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('daily-color')}
          className={`pb-3 px-4 font-semibold transition-all ${
            activeTab === 'daily-color'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-indigo-600'
          }`}
        >
          本日主打色
        </button>
        <button
          onClick={() => setActiveTab('wardrobe-outfit')}
          className={`pb-3 px-4 font-semibold transition-all ${
            activeTab === 'wardrobe-outfit'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-indigo-600'
          }`}
        >
          我的衣櫃穿搭
        </button>
      </div>

      {/* 本日主打色 */}
      {activeTab === 'daily-color' && (
        <div className="space-y-6">
          {/* 副標題 */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">本日主打色</h2>
            <p className="text-gray-600">與 STYLE SHOP 合作推出</p>
          </div>

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
                {/* 色塊展示 */}
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
            
            {/* 色塊展示 */}
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

            {/* CTA 按鈕 */}
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
      )}

      {/* 我的衣櫃穿搭 */}
      {activeTab === 'wardrobe-outfit' && (
        <div className="space-y-6">
          {/* 副標題 */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">我的衣櫃穿搭</h2>
            <p className="text-gray-600">喚醒久未穿單品 · 自動成套與店家推薦</p>
          </div>

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

          {/* 穿搭推薦列表 */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">載入中...</p>
            </div>
          ) : outfitRecommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {outfitRecommendations.map((outfit, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all">
                  {outfit.image_url && (
                    <img
                      src={outfit.image_url}
                      alt={outfit.name}
                      className="w-full h-64 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 mb-2">{outfit.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{outfit.description}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => goToShop(outfit.name)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all text-sm"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        購買
                      </button>
                      <button
                        onClick={() => toggleWishlist(outfit.id)}
                        className={`px-3 py-2 rounded-lg transition-all ${
                          wishlist.has(outfit.id)
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${wishlist.has(outfit.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">暫無穿搭推薦，請先上傳衣物</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
