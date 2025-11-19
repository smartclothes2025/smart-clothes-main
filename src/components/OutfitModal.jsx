// src/components/wardrobe/OutfitModal.jsx
// (已整合您的 UI + API 儲存邏輯)

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';

// (🔴 1. 新增 API_BASE)
const API_BASE = import.meta.env?.VITE_API_BASE || "https://cometical-kyphotic-deborah.ngrok-free.dev";
const fmt = (d) => format(d, 'yyyy-MM-dd');

export default function OutfitModal({ date, outfit, onClose }) {
  // --- 動畫狀態 (保留您的) ---
  const [show, setShow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // --- 表單狀態 (🔴 2. 改為對應 API 欄位) ---
  const [imageUrl, setImageUrl] = useState(outfit?.image_url || ''); // 來自 API 的 image_url
  const [name, setName] = useState(outfit?.name || ''); // (新增) 標題
  const [description, setDescription] = useState(outfit?.description || ''); // (note -> description)
  const [tags, setTags] = useState(outfit?.tags || ''); // (新增) 標籤
  
  const [isEditing, setIsEditing] = useState(!outfit || !outfit.image_url); // 沒有 outfit 或沒有圖片時，自動進入編輯

  // (🔴 3. 新增 API 狀態)
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // 關閉 Modal (保留您的)
  const handleClose = () => {
    setShow(false);
    // (🔴 統一回傳 false，表示「未儲存」或「取消」)
    setTimeout(() => onClose(false), 300);
  };

  // (🔴 4. 替換為 API 儲存邏輯)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError("請先登入");
      setIsSaving(false);
      return;
    }

    try {
      let outfitId;
      
      // (邏輯 1：更新現有穿搭)
      if (outfit && outfit.id) {
        outfitId = outfit.id;
        
        // 只需要執行 Stage 2 (PATCH) 更新文字
        const res = await fetch(`${API_BASE}/outfits/${outfitId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name,
            description: description,
            tags: tags,
            is_complete: true,
            is_public: outfit.is_public || false,
          }),
        });
        
        if (!res.ok) throw new Error('更新穿搭失敗');

      } else {
        // (邏輯 2：創建新的 (純文字) 穿搭)
        
        // Stage 1: POST /outfits (只傳日期)
        const stage1Res = await fetch(`${API_BASE}/outfits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            worn_date: fmt(date),
            image_url: null, // ( 這裡我們假設 Modal 中不處理上傳)
            is_ai_generated: false,
          }),
        });
        
        if (!stage1Res.ok) {
          const errorData = await stage1Res.json().catch(() => ({}));
          throw new Error(`創建穿搭紀錄失敗: ${errorData.detail || stage1Res.statusText}`);
        }
        const newOutfit = await stage1Res.json();
        outfitId = newOutfit.id;

        // Stage 2: PATCH /outfits/{id} (補上文字)
        const stage2Res = await fetch(`${API_BASE}/outfits/${outfitId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name,
            description: description,
            tags: tags,
            is_complete: true,
            is_public: false,
          }),
        });
        
        if (!stage2Res.ok) {
          const errorData = await stage2Res.json().catch(() => ({}));
          throw new Error(`保存穿搭詳情失敗: ${errorData.detail || stage2Res.statusText}`);
        }
      }

      setIsSaving(false);
      // ( 5. 回傳 true，通知父組件 (日曆) 刷新)
      setShow(false);
      setTimeout(() => onClose(true), 300);

    } catch (err) {
      console.error(err);
      setError(err.message);
      setIsSaving(false);
    }
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
          {/* --- 標題列 (保留您的) --- */}
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
            
            {/* 圖片區 (保留您的，只改 state) */}
            <div className="w-full aspect-square bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden relative">
              {imageUrl ? (
                <img src={imageUrl} alt="穿搭" className="w-full h-full object-cover" />
              ) : (
                <PhotoIcon className="w-16 h-16 text-slate-300" />
              )}
              {isEditing && (
                  <button type="button" className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/80 rounded-full text-sm font-medium hover:bg-white shadow">
                    {/* (🔴 暫時禁用，因為 handleSubmit 沒處理上傳) */}
                    {imageUrl ? '更換圖片' : '上傳圖片'}
                  </button>
              )}
            </div>
            
            {/* (🔴 6. 新增 "標題" 欄位) */}
            {isEditing && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  標題
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition"
                  placeholder="為穿搭下個標題"
                />
              </div>
            )}
            
            {/* 筆記區 (🔴 7. 綁定 description) */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
                穿搭筆記
              </label>
              {isEditing ? (
                <textarea
                  id="description"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition"
                  placeholder="紀錄一下今天的天氣或心情..."
                />
              ) : (
                <p className="text-slate-700 min-h-[4rem] whitespace-pre-wrap">
                  {/* 顯示標題和筆記 */}
                  {name && <strong className="block mb-1">{name}</strong>}
                  {description || '沒有筆記。'}
                </p>
              )}
            </div>
            
            {/* (🔴 8. 新增 "標籤" 欄位) */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-slate-700 mb-1.5">
                # 標籤
              </label>
              {isEditing ? (
                <input
                  id="tags"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition"
                  placeholder="例如：OOTD, 藍色穿搭 (用逗號分隔)"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags ? tags.split(',').filter(t => t).map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-xs font-medium">
                      {tag}
                    </span>
                  )) : <span className="text-sm text-slate-500">沒有標籤</span>}
                </div>
              )}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            
          </div>

          {/* --- 頁腳按鈕 (保留您的) --- */}
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
                  disabled={isSaving}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:bg-indigo-300"
                  disabled={isSaving}
                >
                  {isSaving ? '儲存中...' : (outfit ? '儲存變更' : '新增穿搭')}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}