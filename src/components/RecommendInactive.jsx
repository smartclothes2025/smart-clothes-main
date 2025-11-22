import { useState } from 'react';
import useSWR from 'swr';
import fetchJSON from '../lib/api';
import { Icon } from '@iconify/react';
import inactiveMock from '../mock/inactiveMock';
import { resolveGcsUrl, getImageUrl } from '../lib/imageUtils'; // 引入共用的圖片處理函數

export default function RecommendInactive({ days = 30, showTitle = true }) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/v1/recommendations/inactive?days=${days}`,
    fetchJSON,
    { revalidateOnFocus: false }
  );

  const useMock = import.meta.env.VITE_USE_MOCK === 'true';
  const list = useMock
    ? inactiveMock
    : (Array.isArray(data) ? data : (data?.recommendations ?? []));

  const [hiddenIds, setHiddenIds] = useState(new Set());
  const visibleList = list.filter(entry => !hiddenIds.has(entry.item.id));

  function dismissItem(id) {
    setHiddenIds(prev => new Set(prev).add(id));
  }
  function goToMix(baseId, withId) {
    console.log('mix', { baseId, withId });
  }

  if (isLoading && !data && !useMock) {
    return (
      <section className="mt-6">
        {showTitle && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">推薦</h3>
            <span className="text-sm text-gray-500">{days} 天未穿 · 智慧搭配</span>
          </div>
        )}
        <div className="flex gap-4 overflow-x-auto pb-3">
          {[...Array(3)].map((_, i) => (
            // 載入骨架改為較小卡片尺寸
            <div key={i} className="w-[180px] h-[200px] rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (error && !data && !useMock) {
    return (
      <section className="mt-6">
        {showTitle && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">推薦</h3>
            <span className="text-sm text-gray-500">{days} 天未穿 · 智慧搭配</span>
          </div>
        )}
        <div className="p-4 rounded-xl bg-red-50 text-red-600">
          載入失敗：{String(error.message)}
          <button onClick={() => mutate()} className="ml-3 underline">重試</button>
        </div>
      </section>
    );
  }

  if (!visibleList.length) {
    return (
      <section className="mt-6">
        {showTitle && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">推薦</h3>
            <span className="text-sm text-gray-500">{days} 天未穿 · 智慧搭配</span>
          </div>
        )}
        <div className="p-4 rounded-xl bg-green-50 text-green-700">最近都穿得很勤快 🎉 暫時沒有未穿的衣物。</div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      {showTitle && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">推薦</h3>
          <span className="text-sm text-gray-500">{days} 天未穿 · 智慧搭配</span>
        </div>
      )}

      {/* 外層固定；卡片在內層橫向滑動 */}
      <div className="relative">
        <div
          className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory touch-pan-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
          role="list"
        >
          {visibleList.map(({ item, suggestions }) => (
            <article
              key={item.id}
              role="listitem"
              // 卡片寬度改小，與衣物總覽的圖片尺寸一致
              className="snap-start min-w-[160px] sm:min-w-[200px] rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              {/* 圖片上方大塊 */}
              <div className="p-3">
                <div className="relative">
                  {/* 正方形大圖 */}
                  {/* 把主圖縮成和衣物總覽一樣的固定尺寸（96x96）並置中 */}
                  <div className="w-full flex justify-center">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={getImageUrl(item) || 'https://via.placeholder.com/96?text=image'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        width="96"
                        height="96"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* 右上角關閉 */}
                  <button
                    className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 text-gray-600 hover:bg-white shadow"
                    onClick={() => dismissItem(item.id)}
                    title="略過這件"
                  >
                    <Icon icon="mdi:close" className="w-5 h-5" />
                  </button>
                </div>

                {/* 文字資訊 */}
                <div className="mt-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {item.category} · {item.color}
                      </div>
                    </div>
                    <div className="text-xs text-amber-600 whitespace-nowrap">
                      已 {item.daysInactive ?? days} 天未穿
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mt-2">建議搭配</div>

                  {/* 推薦項目：橫向滑、縮圖加大 */}
                  <div className="mt-2 flex gap-3 overflow-x-auto pb-1">
                    {Array.isArray(suggestions) && suggestions.length ? (
                      suggestions.map(s => (
                        <button
                          key={s.id}
                          onClick={() => goToMix(item.id, s.id)}
                          // 改為直列：圖片上、文字下；寬度與衣物總覽一致 (w-24 => 96px)
                          className="shrink-0 inline-flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2 hover:bg-gray-100"
                          title={`用「${item.name}」+「${s.name}」建立穿搭`}
                        >
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={getImageUrl(s) || 'https://via.placeholder.com/96'}
                              alt={s.name}
                              width="96"
                              height="96"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <span className="text-sm text-center mt-1 truncate w-24">{s.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="text-gray-400 text-sm">沒有共現資料，先給你一般規則的推薦</div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="text-xs text-gray-400 px-1">向右滑動查看更多建議 →</div>
      </div>
    </section>
  );
}
