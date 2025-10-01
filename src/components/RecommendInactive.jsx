import { useState } from 'react';
import useSWR from 'swr';
import fetchJSON from '../lib/api';
import { Icon } from '@iconify/react';
import inactiveMock from '../mocks/inactiveMock';

export default function RecommendInactive({ days = 90, showTitle = true }) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/recommendations/inactive?days=${days}`,
    fetchJSON,
    { revalidateOnFocus: false }
  );

  const useMock = import.meta.env.VITE_USE_MOCK === 'true';
  const list = useMock ? inactiveMock : (Array.isArray(data) && data.length ? data : inactiveMock);

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
            <div key={i} className="w-[300px] h-[220px] rounded-2xl bg-gray-100 animate-pulse" />
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
              className="snap-start min-w-[280px] sm:min-w-[320px] rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              {/* 圖片上方大塊 */}
              <div className="p-4">
                <div className="relative">
                  {/* 正方形大圖 */}
                  <div className="w-full rounded-xl overflow-hidden bg-gray-100">
                    {/* 若沒有 plugin，也可用 style={{aspectRatio:'1/1'}} */}
                    <div className="aspect-[1/1]">
                      <img
                        src={item.imageUrl || 'https://via.placeholder.com/400?text=image'}
                        alt={item.name}
                        className="w-full h-full object-cover"
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
                          className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 hover:bg-gray-100"
                          title={`用「${item.name}」+「${s.name}」建立穿搭`}
                        >
                          <img
                            src={s.imageUrl || 'https://via.placeholder.com/64'}
                            alt={s.name}
                            className="w-12 h-12 rounded-lg object-cover"
                            loading="lazy"
                          />
                          <span className="text-sm whitespace-nowrap">{s.name}</span>
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
