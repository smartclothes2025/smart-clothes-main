import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import fetchJSON from '../lib/api';
import { Palette, ShoppingBag, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { getImageUrl } from '../lib/imageUtils';

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

export default function DailyColors() {
  const [selectedColor, setSelectedColor] = useState('neutral');
  const navigate = useNavigate();

  // 呼叫本日主打色 API
  const { data, error, isLoading } = useSWR(
    '/api/v1/recommendations/daily-colors',
    fetchJSON,
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="mt-4 text-gray-600">載入本日主打色推薦中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">載入失敗</h3>
            <p className="text-red-600 mt-1">{error.message || '無法載入本日主打色推薦'}</p>
          </div>
        </div>
      </div>
    );
  }

  const todayMainColor = data?.todayMainColor || 'neutral';
  const colorRecommendations = data?.colorRecommendations || {};
  const weather = data?.weather;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 標題 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Palette className="w-8 h-8 text-indigo-600" />
          本日主打色
        </h1>
        <p className="text-gray-600 mt-2">探索五大色系的穿搭靈感，找到最適合今天的顏色</p>
        
        {/* 今日主色提示 */}
        <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border-l-4 border-indigo-600">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-800">今日推薦主色：</span>
            <span className="text-indigo-600 font-bold">
              {COLOR_PALETTES[todayMainColor]?.name || '中性'}
            </span>
          </div>
          {weather && (
            <p className="text-sm text-gray-600 mt-2">
              🌤️ {weather.temperature}°C · {weather.weather_description}
            </p>
          )}
        </div>
      </div>

      {/* 色系選擇器 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {Object.entries(COLOR_PALETTES).map(([key, palette]) => {
          const isTodayColor = key === todayMainColor;
          const colorData = colorRecommendations[key] || {};
          const itemCount = colorData.totalItems || 0;

          return (
            <button
              key={key}
              onClick={() => setSelectedColor(key)}
              className={`p-4 rounded-lg border-2 transition-all relative ${
                selectedColor === key
                  ? 'border-indigo-600 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* 今日推薦標籤 */}
              {isTodayColor && (
                <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full shadow-md">
                  今日推薦
                </div>
              )}
              
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
              <p className="text-xs text-indigo-600 font-semibold mt-2">
                {itemCount} 件商品
              </p>
            </button>
          );
        })}
      </div>

      {/* 選中色系的商品展示 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Palette className="w-6 h-6 text-indigo-600" />
            {COLOR_PALETTES[selectedColor]?.name}色系搭配
          </h2>
          {selectedColor === todayMainColor && (
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
              今日推薦
            </span>
          )}
        </div>

        {(() => {
          const colorData = colorRecommendations[selectedColor];
          if (!colorData) {
            return (
              <div className="text-center py-12 text-gray-500">
                此色系目前沒有推薦商品
              </div>
            );
          }

          const wardrobeItems = colorData.wardrobeItems || [];
          const storeItems = colorData.storeItems || [];

          return (
            <div className="space-y-8">
              {/* 衣櫃商品 */}
              {wardrobeItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    你的衣櫃 ({wardrobeItems.length} 件)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {wardrobeItems.map(item => (
                      <div key={item.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                        <div className="aspect-square overflow-hidden bg-gray-100">
                          <img
                            src={getImageUrl(item) || item.image_url || 'https://via.placeholder.com/200'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-3">
                          <h5 className="font-medium text-gray-800 truncate text-sm">{item.name}</h5>
                          <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Style Shop 商品 */}
              {storeItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-indigo-600" />
                    Style Shop 推薦 ({storeItems.length} 件)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {storeItems.map(item => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
                        onClick={async (e) => {
                          e.preventDefault();
                          
                          try {
                            const token = localStorage.getItem('token');
                            if (!token) {
                              alert('請先登入');
                              return;
                            }
                            
                            // 1. 先加入衣櫥
                            const productId = item.itemId || item.id || item.productId;
                            console.log('🛒 開始加入衣櫥，商品 ID:', productId);
                            
                            const response = await fetch(
                              `https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1/store/items/${productId}/add-to-wardrobe`,
                              {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json',
                                },
                              }
                            );
                            
                            if (!response.ok) {
                              const errorData = await response.json().catch(() => ({}));
                              console.error('❌ API 回應錯誤:', response.status, errorData);
                              alert(`加入衣櫥失敗: ${errorData.detail || response.statusText}`);
                              return;
                            }
                            
                            const result = await response.json();
                            console.log('✅ 成功加入衣櫥:', result);
                            
                            // 2. 開啟新分頁到外部購物網站
                            if (item.purchaseUrl) {
                              window.open(item.purchaseUrl, '_blank', 'noopener,noreferrer');
                            }
                            
                            // 3. 跳轉到衣櫥頁面
                            setTimeout(() => {
                              navigate('/wardrobe');
                            }, 300);
                            
                          } catch (error) {
                            console.error('❌ 加入衣櫥失敗:', error);
                            alert('加入衣櫥時發生錯誤，請稍後再試');
                          }
                        }}
                      >
                        <div className="aspect-square overflow-hidden bg-gray-100 relative">
                          <img
                            src={getImageUrl(item) || item.imageUrl || 'https://via.placeholder.com/200'}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                          {/* Shop 徽章 */}
                          <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full shadow-md">
                            Shop
                          </div>
                        </div>
                        <div className="p-3">
                          <h5 className="font-medium text-gray-800 truncate text-sm">{item.name}</h5>
                          <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-indigo-600 font-semibold">購買並加入衣櫥 →</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 空狀態 */}
              {wardrobeItems.length === 0 && storeItems.length === 0 && (
                <div className="text-center py-12">
                  <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">此色系目前沒有推薦商品</p>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
