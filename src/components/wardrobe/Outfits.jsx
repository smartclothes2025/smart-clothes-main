// src/components/wardrobe/Outfits.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';

import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import OutfitModal from './OutfitModal';

// 🔴 後端 API
const API_BASE =
  import.meta.env?.VITE_API_BASE ||
  'https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1';

const fmt = (d) => format(d, 'yyyy-MM-dd');

/** gs:// → http 可瀏覽圖片 */
function resolveImageUrl(url) {
  if (!url) return null;

  if (url.startsWith('gs://')) {
    const without = url.replace('gs://', '');
    const [bucket, ...parts] = without.split('/');
    const safe = parts.map(encodeURIComponent).join('/');
    return `https://storage.googleapis.com/${bucket}/${safe}`;
  }
  return url;
}

export default function Outfits() {
  const [outfits, setOutfits] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOutfits = useCallback(async (month) => {
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    const year = format(month, 'yyyy');
    const monthNum = format(month, 'M'); // 1-12

    try {
      const res = await fetch(`${API_BASE}/outfits?year=${year}&month=${monthNum}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('無法載入穿搭資料');
      const data = await res.json();

      const map = {};

      for (const o of data) {
        // ① 先抓 worn_date（以穿搭日期為主要來源）
        let dateStr = null;
        let createdTime = 0;

        if (o.worn_date) {
          try {
            const c = parseISO(o.worn_date);
            dateStr = fmt(c);
            createdTime = c.getTime();
          } catch {}
        }

        // ② worn_date 不行才 fallback 到 created_at
        if (!dateStr && o.created_at) {
          try {
            const w = parseISO(o.created_at);
            dateStr = fmt(w);
            createdTime = w.getTime();
          } catch {}
        }

        if (!dateStr) continue;

        const outf = {
          ...o,
          date: dateStr,
          createdTime,
          img: resolveImageUrl(o.image_url),
          note: o.description || o.name,
        };

        if (!map[dateStr]) {
          map[dateStr] = outf;
        } else {
          // 🔥 如果已有同一天 → 比較誰的 createdTime 比較晚
          if (outf.createdTime > map[dateStr].createdTime) {
            map[dateStr] = outf;
          }
        }
      }

      setOutfits(Object.values(map));
    } catch (err) {
      console.error(err);
      setOutfits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutfits(currentMonth);
  }, [currentMonth, fetchOutfits]);

  const monthLabel = useMemo(
    () => format(currentMonth, 'yyyy 年 MM 月', { locale: zhTW }),
    [currentMonth]
  );

  const handleDayClick = (day) => {
    const found = outfits.find((o) => o.date === fmt(day));
    setSelectedDate(day);
    setSelectedOutfit(found || null);
    setIsModalOpen(true);
  };

  const handleModalClose = (didSave) => {
    if (didSave) fetchOutfits(currentMonth);
    setIsModalOpen(false);
    setSelectedDate(null);
    setSelectedOutfit(null);
  };

  // ----------------------------
  // Header
  // ----------------------------
  const renderHeader = () => (
    <div className="flex justify-between items-center mb-3 md:mb-6 px-2">
      <h2 className="text-lg md:text-2xl font-bold text-slate-800 tracking-wide">
        {monthLabel}
        {loading && (
          <span className="text-sm text-gray-500 ml-2 animate-pulse">載入中...</span>
        )}
      </h2>

      <div className="flex items-center gap-2 md:gap-16">
      
        <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-0.5 bg-white">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="上一月"
          >
            <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
          </button>

          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="下一月"
          >
            <ChevronRightIcon className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );

  // ----------------------------
  // 星期列
  // ----------------------------
  const renderDaysOfWeek = () => {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((d) => (
          <div
            key={d}
            className="text-center font-semibold text-slate-600 text-xs md:text-base py-2"
          >
            {d}
          </div>
        ))}
      </div>
    );
  };

  // ----------------------------
  // 日曆格子
  // ----------------------------
  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = [];
    for (let d = calendarStart; d <= calendarEnd; d = addDays(d, 1)) {
      days.push(new Date(d));
    }

    return (
      <div className="grid grid-cols-7 gap-1 md:gap-3">
        {days.map((d) => {
          const key = d.getTime();
          const dateKey = fmt(d);
          const outfit = outfits.find((o) => o.date === dateKey);

          const isToday = isSameDay(d, new Date());
          const isSelected = selectedDate && isSameDay(d, selectedDate);
          const inMonth = isSameMonth(d, currentMonth);

          return (
            <div
              key={key}
              onClick={() => inMonth && handleDayClick(d)}
              className={`
                relative aspect-square md:aspect-[6/5] 
                min-h-[104px] md:min-h-[140px]
                rounded-xl overflow-hidden group transition-all cursor-pointer

                ${inMonth
                  ? 'bg-white shadow-sm hover:shadow-md ring-1 ring-slate-100 hover:ring-indigo-200'
                  : 'bg-slate-50'}
                
                ${isToday && isSelected ? 'ring-4 ring-indigo-500' : ''}
              `}
            >
              {/* 圖片 */}
              {outfit?.img && (
                <>
                  <img
                    src={outfit.img}
                    alt={outfit.note || '穿搭'}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition" />
                </>
              )}

              {/* 日期 */}
              <time
                className={`
                  absolute top-2 left-2 font-bold text-sm md:text-lg z-10
                  ${outfit
                    ? 'text-white drop-shadow'
                    : isToday
                    ? 'text-white bg-indigo-500 px-2 py-1 rounded-full'
                    : inMonth
                    ? 'text-slate-800'
                    : 'text-slate-400'}
                `}
              >
                {format(d, 'd')}
              </time>

              {/* 有資料但沒圖 → 顯示小圓點 */}
              {!outfit?.img && outfit && (
                <span className="absolute bottom-2 left-2 w-2 h-2 bg-indigo-500 rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="
      w-full 
      max-w-[450px]   
      md:max-w-6xl    
      mx-auto 
      px-1 md:px-8   
    "
  >
      {renderHeader()}
      {renderDaysOfWeek()}
      {renderCells()}

      {isModalOpen && (
        <OutfitModal
          date={selectedDate}
          outfit={selectedOutfit}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
