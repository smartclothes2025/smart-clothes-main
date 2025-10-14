// src/pages/UploadSelect.jsx
import React, { useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../components/Layout";

export default function UploadSelect({ theme, setTheme }) {
  const navigate = useNavigate();
  const location = useLocation();

  const libInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  function onPickedFile(e) {
    const list = Array.from(e.target.files || []);
    const images = list.filter((f) => f.type?.startsWith("image/"));
    if (!images.length) {
      alert("請選擇圖片檔");
      return;
    }
    // 前往編輯頁（多張）
    navigate("/upload/edit", { state: { files: images } });
  }

  return (
    <Layout title="選擇照片">
      <div className="page-wrapper">
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
              multiple
              onChange={onPickedFile}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={onPickedFile}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onPickedFile}
              className="hidden"
            />

            <div className="mt-4 text-xs text-gray-400">
              行動裝置會顯示系統選單；桌面版可直接開啟檔案選擇器。
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
