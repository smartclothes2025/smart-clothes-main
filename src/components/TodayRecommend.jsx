import React from 'react';
import useSWR from 'swr';
import fetchJSON from '../lib/api';
import { Palette, ShoppingBag, Sparkles, Loader2 } from 'lucide-react';
import { getImageUrl } from '../lib/imageUtils';

/**
 * 今日推薦：顯示本日主打色的 3 套穿搭
 * - 與「本日主打色」頁面資料連動
 * - 不需要傳gender，後端自動從current_user判斷
 */
export default function TodayRecommend({ showTitle = true }) {
  // 判斷是否為訪客登入（Login.jsx 中的訪客帳號）
  let isGuest = false;
  try {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token') || '';
    const user = userStr ? JSON.parse(userStr) : null;
    if (
      token.startsWith('guest-token-') ||
      user?.id === 'guest-00000000-0000-0000-0000-000000000001' ||
      user?.email === 'guest@local'
    ) {
      isGuest = true;
    }
  } catch (e) {
    // ignore
  }

  // 收合狀態（儲存在 localStorage，讓使用者偏好被記住）
  const [collapsed, setCollapsed] = React.useState(() => {
    try {
      return localStorage.getItem('today_recommend_collapsed') === '1';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('today_recommend_collapsed', next ? '1' : '0');
      } catch {}
      return next;
    });
  };

  const { data, error, isLoading } = useSWR(
    isGuest ? null : `/api/v1/recommendations/today-recommend`,
    fetchJSON,
    { revalidateOnFocus: false }
  );

  // 訪客：不呼叫後端，只顯示提示文字
  if (isGuest) {
    return (
      <section className="mt-6">
        {showTitle && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-600" />
              今日推薦
            </h3>
          </div>
        )}
        <div className="p-4 rounded-xl bg-yellow-50 text-yellow-800 text-sm">
          訪客無法查看今日推薦，請用註冊帳號或其他使用者登入。
        </div>
      </section>
    );
  }

  const {
    mainColorName,
    mainColorPalette,
    outfits,
  } = data || {};

  const hasOutfits = Array.isArray(outfits) && outfits.length > 0;

  return (
    <section className="mt-6">
      {showTitle && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold">今日推薦</h3>
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && !error && hasOutfits && !collapsed && (
              <span className="text-sm text-indigo-600 font-semibold">
                本日主打色：{mainColorName || '中性色系'}
              </span>
            )}
            <button
              type="button"
              onClick={toggleCollapsed}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100"
            >
              {collapsed ? '展開' : '收合'}
              <span className="inline-block">
                {collapsed ? '▼' : '▲'}
              </span>
            </button>
          </div>
        </div>
      )}

      {collapsed ? null : (
        <>
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <span className="ml-3 text-gray-600">載入中...</span>
            </div>
          )}

          {!isLoading && error && (
            <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm">
              載入失敗：{String(error.message)}
            </div>
          )}

          {!isLoading && !error && !hasOutfits && (
            <div className="p-4 rounded-xl bg-gray-50 text-gray-600 text-sm">
              目前沒有推薦穿搭
            </div>
          )}

          {!isLoading && !error && hasOutfits && (
            <>
              {/* 色系色塊 */}
              {Array.isArray(mainColorPalette) && mainColorPalette.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {mainColorPalette.map((color, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-lg shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}

              {/* 3 套穿搭卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {outfits.map((outfit, idx) => (
                  <article
                    key={outfit.id || idx}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow"
                  >
                    <h4 className="font-semibold text-gray-800 mb-2">{outfit.title}</h4>
                    {outfit.reason && (
                      <p className="text-xs text-gray-500 mb-4">{outfit.reason}</p>
                    )}

                    {/* 穿搭商品列表 */}
                    <div className="space-y-3">
                      {outfit.items?.map((item, itemIdx) => {
                        const isStore = item.source === 'store';
                        return (
                          <div
                            key={itemIdx}
                            className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
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
                                <p className="text-sm font-medium text-gray-800 truncate">
                                  {item.name}
                                </p>
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
                                      // 可選：顯示成功提示
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
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
