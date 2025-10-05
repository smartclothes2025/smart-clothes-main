// src/pages/UploadSelect.jsx
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function UploadSelect({ theme, setTheme }) {
  const navigate = useNavigate();

  const libInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  function onPickedFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔');
      return;
    }
    // 前往編輯頁
    navigate('/upload/edit', { state: { file } });
  }

  return (
    <div className="page-wrapper">
      <Header title="選擇照片" theme={theme} setTheme={setTheme} />
        <div className="max-w-2xl mx-auto px-4 mt-6">
          <div className="bg-white rounded-2xl shadow-sm border p-4">
            <div className="text-sm text-gray-500 mb-3">請選擇來源</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => libInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border p-5 hover:bg-gray-50"
              >
                <span className="text-2xl">🖼️</span>
                <span className="text-sm">照片圖庫</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border p-5 hover:bg-gray-50"
              >
                <span className="text-2xl">📷</span>
                <span className="text-sm">拍照</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border p-5 hover:bg-gray-50"
              >
                <span className="text-2xl">📁</span>
                <span className="text-sm">選擇檔案</span>
              </button>
            </div>

            {/* Hidden inputs for different sources */}
            <input
              ref={libInputRef}
              type="file"
              accept="image/*"
              onChange={onPickedFile}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onPickedFile}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onPickedFile}
              className="hidden"
            />

            <div className="mt-4 text-xs text-gray-400">
              行動裝置會顯示系統選單；桌面版可直接開啟檔案選擇器。
            </div>
          </div>
        </div>
      </div>
    
  );
}
