import React from "react";
import PropTypes from "prop-types";
// 為了顯示圖示，這個元件需要 Heroicons
import { CheckIcon, PhotoIcon } from '@heroicons/react/24/solid';

export default function WardrobeItem({ item, selecting = false, active = false, onToggle = () => {}, inactiveThreshold = 90 }) {
  const name = item?.name ?? "未命名";
  const category = item?.category ?? "";
  const color = item?.color ?? "";
  const img = item?.cover_image_url ?? "";
  const daysInactive = typeof item?.daysInactive === 'number' ? item.daysInactive : null;
  
  // 從環境變數取得伺服器網址，用來組合完整的圖片路徑
  const SERVER_ORIGIN = import.meta.env.VITE_API_BASE.replace(/\/api\/v1\/?$/, "");

  return (
    <div
      className={`relative border rounded-xl p-3 bg-white shadow-sm transition-all duration-200
        ${selecting ? 'cursor-pointer hover:shadow-lg hover:scale-[1.03]' : ''}
        ${selecting && active ? 'ring-2 ring-indigo-500 shadow-lg' : 'border-slate-200'}`}
      onClick={() => selecting && onToggle()}
    >
      {/* 未穿天數徽章 */}
      {daysInactive !== null && daysInactive >= inactiveThreshold && (
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
            {daysInactive} 天未穿
          </span>
        </div>
      )}

      {/* 選取模式的打勾圖示 */}
      {selecting && (
        <div
          className={`absolute top-2.5 left-2.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200
            ${active ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}
        >
          <CheckIcon className={`w-4 h-4 text-white transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-0'}`} />
        </div>
      )}

      {/* 圖片區域 */}
      <div className="aspect-square w-full overflow-hidden rounded-lg flex items-center justify-center bg-slate-100">
        {img ? (
          <img src={`${SERVER_ORIGIN}${img}`} alt={name} className="w-full h-full object-cover" />
        ) : (
          <PhotoIcon className="w-12 h-12 text-slate-300" />
        )}
      </div>

      {/* 文字資訊 */}
      <div className="mt-2 text-sm">
        <div className="font-semibold text-slate-800 truncate">{name}</div>
        <div className="text-slate-500 truncate">{category}{category && color ? ' • ' : ''}{color}</div>
      </div>
    </div>
  );
}

WardrobeItem.propTypes = {
  item: PropTypes.object.isRequired,
  selecting: PropTypes.bool,
  active: PropTypes.bool,
  onToggle: PropTypes.func,
  inactiveThreshold: PropTypes.number,
};