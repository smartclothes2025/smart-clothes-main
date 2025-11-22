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
  const { data, error, isLoading } = useSWR(
    `/api/v1/recommendations/today-recommend`,
    fetchJSON,
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <section className="mt-6">
        {showTitle && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">今日推薦</h3>
            <span className="text-sm text-gray-500">本日主打色穿搭</span>
          </div>
        )}
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="ml-3 text-gray-600">載入中...</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-6">
        {showTitle && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">今日推薦</h3>
            <span className="text-sm text-gray-500">本日主打色穿搭</span>
          </div>
        )}
        <div className="p-4 rounded-xl bg-red-50 text-red-600">
          載入失敗：{String(error.message)}
        </div>
      </section>
    );
  }

  const {
    mainColorName,
    mainColorPalette,
    outfits,
  } = data || {};

  if (!outfits || outfits.length === 0) {
    return (
      <section className="mt-6">
        {showTitle && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">今日推薦</h3>
            <span className="text-sm text-gray-500">本日主打色穿搭</span>
          </div>
        )}
        <div className="p-4 rounded-xl bg-gray-50 text-gray-600">
          目前沒有推薦穿搭
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      {showTitle && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600" />
            今日推薦
          </h3>
          <span className="text-sm text-indigo-600 font-semibold">
            本日主打色：{mainColorName || '中性色系'}
          </span>
        </div>
      )}

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
                        onClick={() => window.open(item.purchaseUrl, '_blank')}
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
    </section>
  );
}
