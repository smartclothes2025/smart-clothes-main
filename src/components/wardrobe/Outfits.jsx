// src/components/wardrobe/Outfits.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react'

import {

  format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek,

  addDays, addMonths, subMonths, isSameMonth, isSameDay

} from 'date-fns'

import { zhTW } from 'date-fns/locale'

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

import OutfitModal from '../OutfitModal' // 🔴 確保路徑正確



// (🔴 新增 API_BASE)

const API_BASE = import.meta.env?.VITE_API_BASE || "https://cometical-kyphotic-deborah.ngrok-free.dev";

const fmt = (d) => format(d, 'yyyy-MM-dd')



export default function Outfits() {

  const [outfits, setOutfits] = useState([])

  const [currentMonth, setCurrentMonth] = useState(new Date())

  const [selectedDate, setSelectedDate] = useState(null)

  const [isModalOpen, setIsModalOpen] = useState(false)

  const [loading, setLoading] = useState(true) // (🔴 新增 loading state)



  // (🔴 --- 替換 load 函數 --- 🔴)

  // 舊的 load 和 localStorage 相關的 useEffect 已被移除



  const fetchOutfits = useCallback(async (month) => {

    setLoading(true);

    const token = localStorage.getItem('token');

    if (!token) {

      setLoading(false);

      // (可選) 導向登入頁

      return;

    }



    const year = format(month, 'yyyy');

    const monthNum = format(month, 'M'); // 'M' 得到 1-12



    try {

      const res = await fetch(`${API_BASE}/outfits?year=${year}&month=${monthNum}`, {

        headers: { 'Authorization': `Bearer ${token}` }

      });

      

      if (!res.ok) throw new Error('無法載入穿搭資料');



      const data = await res.json();

      

      // (🔴 轉換 API 資料格式以符合您的日曆)

      const parsed = data.map(o => ({

        ...o, // 保留 API 傳來的 (id, name, description, tags, image_url...)

        date: fmt(parseISO(o.worn_date)), // API 的 worn_date 轉為 'yyyy-MM-dd'

        img: o.image_url, // (🔴 映射：image_url -> img)

        note: o.description || o.name, // (🔴 映射：description/name -> note)

      }));

      

      setOutfits(parsed);

    } catch (err) {

      console.error("獲取穿搭失敗:", err);

      setOutfits([]); // 發生錯誤時清空

    } finally {

      setLoading(false);

    }

  }, []); // useCallback 依賴為空



  // (🔴 修改 useEffect：改為依賴 currentMonth)

  useEffect(() => {

    fetchOutfits(currentMonth);

  }, [currentMonth, fetchOutfits]);

  

  // (🔴 移除 storage event listener)



  const monthLabel = useMemo(

    () => format(currentMonth, 'yyyy 年 MM 月', { locale: zhTW }),

    [currentMonth]

  )



  const handleDayClick = (day) => { setSelectedDate(day); setIsModalOpen(true) }

  

  // (🔴 --- 替換 handleModalClose 函數 --- 🔴)

  const handleModalClose = (didSave) => {

    // 如果 Modal 回報儲存成功 (didSave === true)

    // 我們就重新載入當前月份的資料

    if (didSave) {

      fetchOutfits(currentMonth);

    }

    setIsModalOpen(false); 

    setSelectedDate(null);

  }



  // (🔴 renderHeader 函數不變)

  const renderHeader = () => (

    <div className="flex justify-between items-center mb-3 md:mb-6 px-2">

      <h2 className="text-lg md:text-2xl font-bold md:font-extrabold text-slate-800 tracking-wide">

        {monthLabel}

      {/* (🔴 新增 loading 提示) */}

      {loading && <span className="text-sm text-gray-500 ml-2 animate-pulse">載入中...</span>}

      </h2>

      <div className="flex items-center gap-2 md:gap-3">

        <button

          onClick={() => setCurrentMonth(new Date())}

          className="px-3 md:px-4 py-1 md:py-2 text-sm font-semibold text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"

        >

          今天

        </button>

        <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-0.5 bg-white">

          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}

                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" aria-label="上一月">

            <ChevronLeftIcon className="w-5 h-5 text-slate-600" />

          </button>

          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}

                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" aria-label="下一月">

            <ChevronRightIcon className="w-5 h-5 text-slate-600" />

          </button>

        </div>

      </div>

    </div>

  )



  // (🔴 renderDaysOfWeek 函數不變)

  const renderDaysOfWeek = () => {

    // ... (您的程式碼不變)

    const days = ['日', '一', '二', '三', '四', '五', '六']

    return (

      <div className="grid grid-cols-7 gap-0.5 md:gap-2 mb-1 md:mb-2 md:border-b md:border-slate-200">

        {days.map(d => (

          <div key={d} className="text-center font-semibold md:font-bold text-slate-500 md:text-slate-600 text-xs md:text-base py-1.5 md:py-3">

            {d}

          </div>

        ))}

      </div>

    )

  }



  // (🔴 renderCells 函數不變，因為我們已在 fetchOutfits 中映射了 'img' 和 'note')

  const renderCells = () => {

    // ... (您的程式碼不變)

    const monthStart = startOfMonth(currentMonth)

    const monthEnd = endOfMonth(monthStart)

    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0, locale: zhTW })

    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0, locale: zhTW })



    const days = []

    for (let d = calendarStart; d <= calendarEnd; d = addDays(d, 1)) days.push(new Date(d))



    return (

      <div role="grid" aria-label={monthLabel} className="grid grid-cols-7 gap-1 md:gap-3">

        {days.map(d => {

          const key = d.getTime()

          const dateKey = fmt(d)

          // (🔴 這裡的 outfit.img 和 outfit.note 會正常運作)

          const outfit = outfits.find(o => o.date === dateKey) 

          const isToday = isSameDay(d, new Date())

          const inMonth = isSameMonth(d, currentMonth)

          const canInteract = inMonth



          return (

            <div

              key={key}

              // ... (其餘 classNames 和 onClick 邏輯不變) ...

              className={`relative aspect-square md:aspect-[4/3] lg:aspect-square

                min-h-[104px] md:min-h-[140px] 

                rounded-xl overflow-hidden group transition-all duration-200 ease-in-out outline-none

                ${inMonth

                  ? 'bg-white shadow-sm md:shadow-lg hover:shadow-md md:hover:shadow-xl cursor-pointer ring-0 md:ring-1 md:ring-slate-100 md:hover:ring-indigo-200 focus:ring-2 focus:ring-indigo-400'

                  : 'bg-slate-50'}

              `}

              onClick={() => canInteract && handleDayClick(d)}

              // ...

            >

              {/* 有圖才顯示圖片 */}

              {outfit?.img && (

                <>

                  <img

                    src={outfit.img}

                    alt={outfit.note || '穿搭'}

                    loading="lazy"

                    className="w-full h-full object-cover absolute inset-0"

                    onError={e => (e.currentTarget.style.display = 'none')}

                  />

                  <div className="absolute inset-0 bg-black/20 md:bg-black/30 md:group-hover:bg-black/50 transition-colors" />

                </>

              )}



              {/* 日期角標 */}

              <time

                dateTime={dateKey}
                className={`absolute top-2 left-2 md:top-3 md:left-3 z-10 

                  font-bold text-sm md:text-lg 

                  ${outfit

                    ? 'text-white drop-shadow-md' // 有穿搭圖片時用白色

                    : isToday 

                      ? 'text-white bg-indigo-500 rounded-full px-2 py-1 leading-none' // 今天且無圖

                      : inMonth 

                        ? 'text-slate-800' // 當月且無圖

                        : 'text-slate-400' // 非當月

                  }

                `}

              >

                {/* 🎯 核心：這裡才是顯示日期的數字 */}

                {format(d, 'd', { locale: zhTW })}
              </time>



              {/* 沒圖但有紀錄 → 小圓點提示 */}

              {!outfit?.img && outfit && (

                <span className="absolute bottom-2 left-2 w-2 h-2 bg-indigo-500 rounded-full" aria-hidden="true" />

              )}

            </div>

          )

        })}

      </div>

    )

  }



  // (🔴 尋找 selectedOutfit 的邏輯更新)

  // 我們直接從 API 來的 outfits 陣列中尋找

  const selectedOutfit = outfits.find(o => selectedDate && o.date === fmt(selectedDate))



  return (

    <div className="w-full max-w-none md:max-w-6xl mx-auto px-0 md:p-8 p-3 bg-white/0 rounded-2xl min-h-[60vh] md:min-h-[70vh]">

      {renderHeader()}

      {renderDaysOfWeek()}

      {renderCells()}

      {isModalOpen && (

        // (🔴 傳遞 API 的 outfit 物件)

        <OutfitModal date={selectedDate} outfit={selectedOutfit} onClose={handleModalClose} />

      )}

    </div>

  )

}
