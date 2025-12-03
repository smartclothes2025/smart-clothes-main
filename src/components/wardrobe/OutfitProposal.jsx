import React, { useState, useEffect } from 'react';
import { ShoppingBag, Palette, Loader2, Sparkles } from 'lucide-react';
import useSWR from 'swr';
import fetchJSON from '../../lib/api';
import { getImageUrl } from '../../lib/imageUtils';
import { useWeather } from '../../hooks/useWeather';

const API_BASE = import.meta.env?.VITE_API_BASE || "https://cometical-kyphotic-deborah.ngrok-free.dev";

// 色系配置（與後端三色系對應：neutral / earth / cool）
const COLOR_PALETTES = {
  neutral: {
    name: '中性色系',
    colors: ['#F5F5F5', '#D3D3D3', '#808080', '#2F4F4F'],
    description: '簡約百搭的中性與基礎色'
  },
  earth: {
    name: '大地暖色系',
    colors: ['#F5DEB3', '#D2B48C', '#C19A6B', '#8B4513'],
    description: '卡其、咖啡、米色等溫暖大地色'
  },
  cool: {
    name: '清爽冷色系',
    colors: ['#87CEEB', '#4169E1', '#32CD32', '#006400'],
    description: '藍、綠與藍綠系的清爽配色'
  },
};

const GENDERS = ['女生', '男生'];

export default function OutfitProposal() {
  const [selectedGender, setSelectedGender] = useState('女生');
  
  // 統一的天氣 Hook：與首頁 WeatherCard 共用，依使用者所在位置變動
  const { weather } = useWeather();
  
  // 呼叫本日主打色 API（三色系各自聚合推薦）
  // ✨ 不傳 gender，後端自動從 current_user.gender 判斷
  const { data: dailyData, error: dailyError, isLoading: dailyLoading } = useSWR(
    `/api/v1/recommendations/daily-color-outfits`,
    fetchJSON,
    { revalidateOnFocus: false }
  );

  const families = dailyData?.families || [];
  const mainColorFamily = dailyData?.mainColorFamily || families.find(f => f.isMain)?.key || 'neutral';
  const mainColorName = dailyData?.mainColorName || COLOR_PALETTES[mainColorFamily]?.name || '中性色系';
  const mainColorPalette = dailyData?.mainColorPalette || COLOR_PALETTES[mainColorFamily]?.colors || [];
  
  // 預設選中今日主色
  const [selectedColor, setSelectedColor] = useState(mainColorFamily);
  
  // 當 mainColorFamily 更新時，同步 selectedColor
  useEffect(() => {
    if (mainColorFamily) {
      setSelectedColor(mainColorFamily);
    }
  }, [mainColorFamily]);

  // ✨ 從 API 回傳中自動取得性別，不再手動查詢
  useEffect(() => {
    if (dailyData?.gender) {
      const genderMap = { 'women': '女生', 'men': '男生' };
      setSelectedGender(genderMap[dailyData.gender] || '女生');
    }
  }, [dailyData]);

  // 跳轉到購買
  const goToShop = (itemName) => {
    window.open(`https://styleshop-delta.vercel.app/women.html?search=${encodeURIComponent(itemName)}`, '_blank');
  };

  // ✨ 已移除「以此為主色」功能，由系統自動選擇

  return (
    <div className="w-full space-y-6">

      {/* ✨ 性別由後端自動判斷，移除切換按鈕 */}
      {dailyData?.gender && (
        <div className="text-center text-sm text-gray-500">
          當前性別：{selectedGender}
        </div>
      )}

      {/* 今日主色提示 */}
      {!dailyLoading && mainColorFamily && (
        <div className="mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border-l-4 border-indigo-600">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-800">今日推薦主色：</span>
            <span className="text-indigo-600 font-bold">
              {mainColorName}
            </span>
          </div>
          {weather && (
            <p className="text-sm text-gray-600 mt-2">
              🌤️ {Math.round(weather.temperature)}°C · {weather.description}
            </p>
          )}
        </div>
      )}
      
      {/* 色系選擇（三色系：neutral / earth / cool） */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
        {families.map((family) => {
          const palette = COLOR_PALETTES[family.key] || {};
          const isTodayColor = family.isMain;
          const outfitCount = family.outfits?.length || 0;
          
          return (
            <button
              key={family.key}
              onClick={() => setSelectedColor(family.key)}
              className={`p-4 rounded-lg border-2 transition-all relative ${
                selectedColor === family.key
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
                {(family.colors || palette.colors || []).map((color, idx) => (
                  <div
                    key={idx}
                    className="flex-1 h-8 rounded"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <p className="font-semibold text-gray-800 text-sm">{family.name || palette.name}</p>
              <p className="text-xs text-gray-600 mt-1">{palette.description}</p>
              {!dailyLoading && outfitCount > 0 && (
                <p className="text-xs text-indigo-600 font-semibold mt-2">
                  {outfitCount} 套穿搭
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* 選中色系的詳細展示 */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-6 h-6 text-indigo-600" />
          <h3 className="text-xl font-bold text-gray-800">
            {(COLOR_PALETTES[selectedColor]?.name || '色系')}搭配建議
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {(COLOR_PALETTES[selectedColor]?.colors || mainColorPalette).map((color, idx) => (
            <div key={idx} className="text-center">
              <div
                className="w-full h-24 rounded-lg shadow-md mb-2"
                style={{ backgroundColor: color }}
              />
              <p className="text-xs text-gray-600 font-mono">{color}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => goToShop(COLOR_PALETTES[selectedColor]?.name || selectedColor)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-md"
          >
            <ShoppingBag className="w-5 h-5" />
            去 Style Shop 看同款
          </button>
          {/* ✨ 已移除「以此為主色」按鈕 */}
        </div>

        {/* 本色系穿搭推薦 (3套) */}
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600" />
            {COLOR_PALETTES[selectedColor].name}色系穿搭推薦
          </h4>
          
          {dailyLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <span className="ml-3 text-gray-600">載入中...</span>
            </div>
          ) : dailyError ? (
            <div className="p-4 rounded-lg bg-red-50 text-red-600">
              載入失敗：{String(dailyError.message)}
            </div>
          ) : (() => {
              const currentFamily = families.find(f => f.key === selectedColor);
              const outfits = currentFamily?.outfits || [];
              
              if (outfits.length === 0) {
                return (
                  <div className="p-4 rounded-lg bg-gray-50 text-gray-600">
                    此色系目前沒有穿搭推薦
                  </div>
                );
              }
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {outfits.map((outfit, idx) => (
                    <div key={outfit.id || idx} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                      <h5 className="font-semibold text-gray-800 mb-2">{outfit.title}</h5>
                      <p className="text-xs text-gray-500 mb-4">{outfit.reason}</p>
                      
                      {/* 穿搭商品列表 */}
                      <div className="space-y-3">
                        {outfit.items?.map((item, itemIdx) => {
                          const isStore = item.source === 'store';
                          return (
                            <div key={itemIdx} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                              {/* 商品圖片 */}
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                <img
                                  src={item.imageUrl || 'https://via.placeholder.com/64'}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              
                              {/* 商品資訊 */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                                  {isStore ? (
                                    <span className="flex-shrink-0 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <ShoppingBag className="w-3 h-3" />
                                      Shop
                                    </span>
                                  ) : (
                                    <span className="flex-shrink-0 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <Sparkles className="w-3 h-3" />
                                      衣櫃
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">{item.category}</p>
                              </div>
                              
                              {/* 店家商品購買按鈕 */}
                              {isStore && item.purchaseUrl && (
                                <button
                                  onClick={async () => {
                                    // 1. 跳轉到外部連結
                                    window.open(item.purchaseUrl, '_blank');
                                    
                                    // 2. 同時加入衣櫥
                                    try {
                                      const token = localStorage.getItem('token');
                                      if (!token) return;
                                      
                                      const productId = item.itemId || item.id || item.productId;
                                      const response = await fetch(
                                        `https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1/store/items/${productId}/add-to-wardrobe`,
                                        {
                                          method: 'POST',
                                          headers: {
                                            'Authorization': `Bearer ${token}`,
                                          },
                                        }
                                      );
                                      
                                      if (response.ok) {
                                        const result = await response.json();
                                        console.log('✅ 已加入衣櫥:', result);
                                      }
                                    } catch (error) {
                                      console.error('❌ 加入衣櫥失敗:', error);
                                    }
                                  }}
                                  className="flex-shrink-0 px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                  購買
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          }
        </div>
      </div>
    </div>
  );
}
