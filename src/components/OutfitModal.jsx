// src/components/wardrobe/OutfitModal.jsx
// [!!] 這是新檔案

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';

export default function OutfitModal({ date, outfit, onClose }) {
  // --- 動畫狀態 ---
  const [show, setShow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(timer);
  }, []);
  
  // --- 表單狀態 ---
  // (使用您 localStorage 中的欄位： img, note)
  const [imageUrl, setImageUrl] = useState(outfit?.img || '');
  const [note, setNote] = useState(outfit?.note || '');
  const [isEditing, setIsEditing] = useState(!outfit); // 如果沒有 outfit，自動進入編輯模式

  const handleClose = () => {
    setShow(false);
    setTimeout(() => onClose(null), 300); // 300ms 配合動畫
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // 這裡您可以呼叫 API 或處理圖片上傳
    // ...
    
    // 成功後，將新資料回傳給父元件 (Calendar)
    const newOutfitData = {
      // id: outfit?.id, // id 會由父元件處理
      date: format(date, 'yyyy-MM-dd'),
      img: imageUrl || '/default-outfit.png', // [!!] 欄位名稱同 localStorage
      note: note,
    };
    
    setShow(false);
    setTimeout(() => onClose(newOutfitData), 300);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      <div 
        className={`relative bg-white rounded-2xl shadow-xl w-[min(500px,95%)] z-10 transition-all duration-300 ${
          show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <form onSubmit={handleSubmit}>
          {/* --- 標題列 --- */}
          <div className="flex justify-between items-center p-5 border-b border-slate-200">
            <h3 className="text-xl font-bold text-slate-800">
              {format(date, 'yyyy 年 MM 月 dd 日', { locale: zhTW })}
            </h3>
            <button 
              type="button" 
              onClick={handleClose} 
              className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* --- 內容 --- */}
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            
            {/* 圖片區 */}
            <div className="w-full aspect-square bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden relative">
              {imageUrl ? (
                <img src={imageUrl} alt="穿搭" className="w-full h-full object-cover" />
              ) : (
                <PhotoIcon className="w-16 h-16 text-slate-300" />
              )}
              {/* [!!] 之後可以加上 '上傳圖片' 的按鈕 */}
              {isEditing && (
                 <button type="button" className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/80 rounded-full text-sm font-medium hover:bg-white shadow">
                   上傳圖片
                 </button>
              )}
            </div>
            
            {/* 筆記區 */}
            <div>
              <label htmlFor="note" className="block text-sm font-medium text-slate-700 mb-1.5">
                穿搭筆記
              </label>
              {isEditing ? (
                <textarea
                  id="note"
                  rows="3"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition"
                  placeholder="紀錄一下今天的天氣或心情..."
                />
              ) : (
                <p className="text-slate-700 min-h-[4rem]">{note || '沒有筆記。'}</p>
              )}
            </div>
          </div>

          {/* --- 頁腳按鈕 (使用您系統的標準按鈕樣式) --- */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            {!isEditing && (
              <button 
                type="button" 
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
              >
                編輯
              </button>
            )}
            
            {isEditing && (
              <>
                <button 
                  type="button" 
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
                >
                  {outfit ? '儲存變更' : '新增穿搭'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}