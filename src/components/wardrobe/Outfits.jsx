// src/components/wardrobe/Outfits.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay
} from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import OutfitModal from '../OutfitModal'

const fmt = (d) => format(d, 'yyyy-MM-dd')

export default function Outfits() {
  const [outfits, setOutfits] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const load = useCallback(() => {
    const saved = localStorage.getItem('outfit_history')
    if (!saved) return setOutfits([])
    try {
      const parsed = JSON.parse(saved)
        .map(o => ({ ...o, date: o.date?.length > 10 ? fmt(parseISO(o.date)) : o.date }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
      setOutfits(parsed)
    } catch {}
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    const onStorage = () => load()
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [load])

  const monthLabel = useMemo(
    () => format(currentMonth, 'yyyy 年 MM 月', { locale: zhTW }),
    [currentMonth]
  )

  const handleDayClick = (day) => { setSelectedDate(day); setIsModalOpen(true) }
  const handleModalClose = (newOutfitData) => {
    if (newOutfitData) {
      const dateKey = newOutfitData.date || fmt(selectedDate || new Date())
      const exist = outfits.find(o => o.date === dateKey)
      const updated = exist
        ? outfits.map(o => (o.date === dateKey ? { ...exist, ...newOutfitData, date: dateKey } : o))
        : [...outfits, { ...newOutfitData, id: outfits.length ? Math.max(...outfits.map(o => o.id || 0)) + 1 : 1, date: dateKey }]
      updated.sort((a, b) => new Date(b.date) - new Date(a.date))
      setOutfits(updated)
      localStorage.setItem('outfit_history', JSON.stringify(updated))
    }
    setIsModalOpen(false); setSelectedDate(null)
  }

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-3 md:mb-6 px-2">
      <h2 className="text-lg md:text-2xl font-bold md:font-extrabold text-slate-800 tracking-wide">
        {monthLabel}
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

  const renderDaysOfWeek = () => {
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

  const renderCells = () => {
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
          const outfit = outfits.find(o => o.date === dateKey)
          const isToday = isSameDay(d, new Date())
          const inMonth = isSameMonth(d, currentMonth)
          const canInteract = inMonth

          return (
            <div
              key={key}
              role="gridcell"
              tabIndex={canInteract ? 0 : -1}
              onClick={() => canInteract && handleDayClick(d)}
              onKeyDown={(e) => (canInteract && (e.key === 'Enter' || e.key === ' ') && handleDayClick(d))}
              className={`relative aspect-square md:aspect-[4/3] lg:aspect-square
                min-h-[104px] md:min-h-[140px]   /* ↑ 手機提高最小高度 → 看起來更大 */
                rounded-xl overflow-hidden group transition-all duration-200 ease-in-out outline-none
                ${inMonth
                  ? 'bg-white shadow-sm md:shadow-lg hover:shadow-md md:hover:shadow-xl cursor-pointer ring-0 md:ring-1 md:ring-slate-100 md:hover:ring-indigo-200 focus:ring-2 focus:ring-indigo-400'
                  : 'bg-slate-50'}
              `}
              aria-selected={selectedDate ? isSameDay(selectedDate, d) : false}
              aria-label={`${dateKey}${outfit ? '，已有穿搭' : ''}`}
            >
              {/* 有圖才顯示圖片；移除 + 號與 hover 蒙版 */}
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
                className={`absolute top-2 left-2 md:top-3 md:left-3 font-semibold text-xs md:text-base p-1 md:p-1.5 z-10
                  ${isToday
                    ? 'bg-indigo-600 text-white rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center font-bold text-sm md:text-base shadow md:shadow-lg'
                    : outfit?.img
                      ? 'text-white'
                      : inMonth
                        ? 'text-slate-700'
                        : 'text-slate-400'
                  }`}
              >
                {format(d, 'd')}
              </time>

              {/* 沒圖但有紀錄 → 小圓點提示（保留；覺得多也可以刪掉） */}
              {!outfit?.img && outfit && (
                <span className="absolute bottom-2 left-2 w-2 h-2 bg-indigo-500 rounded-full" aria-hidden="true" />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const selectedOutfit = outfits.find(o => selectedDate && o.date === fmt(selectedDate))

  return (
    /* 手機用滿寬（max-w-none、px-0）→ 格子更寬；桌機維持 6xl */
    <div className="w-full max-w-none md:max-w-6xl mx-auto px-0 md:p-8 p-3 bg-white/0 rounded-2xl min-h-[60vh] md:min-h-[70vh]">
      {renderHeader()}
      {renderDaysOfWeek()}
      {renderCells()}
      {isModalOpen && (
        <OutfitModal date={selectedDate} outfit={selectedOutfit} onClose={handleModalClose} />
      )}
    </div>
  )
}
