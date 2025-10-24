// src/components/wardrobe/Outfits.jsx
// [!!] 這是「美化後」的行事曆版本

import React, { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addMonths, 
  subMonths, 
  isSameMonth, 
  isSameDay 
} from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import OutfitModal from '../OutfitModal'; // 您的彈窗元件

export default function Outfits() {
  const [outfits, setOutfits] = useState([]);
  
  // [!!] 沿用您現有的 localStorage 邏輯
  useEffect(() => {
    const saved = localStorage.getItem('outfit_history');
    if (saved) {
        const parsed = JSON.parse(saved).sort((a, b) => new Date(b.date) - new Date(a.date));
        setOutfits(parsed);
    }
  }, []);

  useEffect(() => {
    const refresh = () => {
      const saved = localStorage.getItem('outfit_history');
      if (saved) {
        const parsed = JSON.parse(saved).sort((a, b) => new Date(b.date) - new Date(a.date));
        setOutfits(parsed);
      }
    };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  // --- 行事曆狀態 ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- 標頭 (Header) ---
  const renderHeader = () => (
    <div className="flex justify-between items-center mb-4 px-2">
      <h2 className="text-xl font-bold text-slate-800">
        {format(currentMonth, 'yyyy 年 MM 月', { locale: zhTW })}
      </h2>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentMonth(new Date())}
          className="px-3 py-1 text-sm font-semibold text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          今天
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-full hover:bg-slate-100"
          >
            <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-full hover:bg-slate-100"
          >
            <ChevronRightIcon className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );

  // --- 星期 (Days of Week) ---
  const renderDaysOfWeek = () => {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map(day => (
          <div key={day} className="text-center font-semibold text-slate-500 text-sm py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  // --- 日期格子 (Cells) ---
  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      // [!!] 美化：格子間距 gap-2
      <div className="grid grid-cols-7 gap-2">
        {days.map(d => {
          const formattedDate = format(d, 'yyyy-MM-dd');
          const outfit = outfits.find(o => o.date === formattedDate);
          const isToday = isSameDay(d, new Date());
          const isThisMonth = isSameMonth(d, currentMonth);

          return (
            <div
              key={d.toString()}
              onClick={() => isThisMonth && handleDayClick(d)} // [!!] 只有本月日期可點
              className={`relative aspect-square rounded-xl overflow-hidden group transition-all
                ${isThisMonth ? 'bg-white shadow-sm cursor-pointer' : 'bg-slate-50'}
              `}
            >
              {/* [!!] 1. 穿搭圖片 (如果存在) */}
              {outfit && (
                <>
                  <img
                    src={outfit.img || '/default-outfit.png'}
                    alt={outfit.note || '穿搭'}
                    className="w-full h-full object-cover absolute inset-0"
                    onError={e => (e.currentTarget.src = '/default-outfit.png')}
                  />
                  {/* 黑色遮罩，滑鼠移上去時變暗 */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors"></div>
                </>
              )}

              {/* [!!] 2. 日期數字 */}
              <time
                dateTime={formattedDate}
                className={`absolute top-2 left-2 font-semibold text-xs p-1
                  ${isToday 
                    // "今天" 的樣式 (藍色圓圈)
                    ? 'bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm' 
                    // "有穿搭" 的樣式 (白色文字)
                    : outfit 
                      ? 'text-white' 
                      // "本月" 的樣式 (深灰文字)
                      : isThisMonth 
                        ? 'text-slate-700' 
                        // "非本月" 的樣式 (淺灰文字)
                        : 'text-slate-400'
                  }
                `}
              >
                {format(d, 'd')}
              </time>
              
              {/* [!!] 3. "新增" 圖示 (僅在 "本月" 且 "無穿搭" 的日期上 hover 顯示) */}
              {!outfit && isThisMonth && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlusCircleIcon className="w-8 h-8 text-slate-400 group-hover:text-indigo-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // --- 點擊日期的處理 (邏輯不變) ---
  const handleDayClick = (day) => {
    setSelectedDate(day);
    setIsModalOpen(true);
  };

  // --- 關閉 Modal 的處理 (回寫 localStorage) (邏輯不變) ---
  const handleModalClose = (newOutfitData) => {
    if (newOutfitData) {
      let updatedOutfits = [];
      const existing = outfits.find(o => o.date === newOutfitData.date);
      
      if (existing) { // 更新
        updatedOutfits = outfits.map(o => 
          o.date === newOutfitData.date ? { ...existing, ...newOutfitData } : o
        );
      } else { // 新增
        const newId = outfits.length > 0 ? Math.max(...outfits.map(o => o.id)) + 1 : 1;
        updatedOutfits = [...outfits, { ...newOutfitData, id: newId }];
      }

      updatedOutfits.sort((a, b) => new Date(b.date) - new Date(a.date));
      setOutfits(updatedOutfits);
      localStorage.setItem('outfit_history', JSON.stringify(updatedOutfits)); 
    }
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  // 找到選中日期的穿搭資料 (邏輯不變)
  const selectedOutfit = outfits.find(o => 
    selectedDate && o.date === format(selectedDate, 'yyyy-MM-dd')
  );

  // --- [!!] 美化：調整外層 padding 和背景色 ---
  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white/0 rounded-2xl">
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