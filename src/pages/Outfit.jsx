// src/pages/Outfit.jsx
import React, { useState } from "react";
import { format } from "date-fns";
import { useLocation } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useToast } from "../components/ToastProvider";
import AskModal from "../components/AskModal";

const API_BASE =
  import.meta.env?.VITE_API_BASE ||
  "https://cometical-kyphotic-deborah.ngrok-free.dev";

export default function Outfit({ theme, setTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // 表單欄位
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [syncToPost, setSyncToPost] = useState(false);
  // 若從日曆 Modal 跳轉過來，會夾帶 location.state.wornDate
  const initialWornDate = (location && location.state && location.state.wornDate) || format(new Date(), "yyyy-MM-dd");
  const [wornDate, setWornDate] = useState(initialWornDate);

  // 上傳穿搭照片
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // 狀態 (使用 uploading 來表示整個儲存過程)
  const [uploading, setUploading] = useState(false);
  const [askCancel, setAskCancel] = useState(false);

  // 處理照片上傳（前端預覽）
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    // 每次選擇新照片時，清除舊的 URL，讓垃圾回收機制釋放記憶體
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl); 
    }
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  // 儲存穿搭：前端轉成 base64，呼叫 /fitting/save-outfit
  const handleSave = async () => {
    if (!title.trim()) {
      toast.addToast({
        type: "error",
        title: "缺少標題",
        message: "請為這套穿搭取一個標題",
      });
      return;
    }

    if (!file) {
      toast.addToast({
        type: "error",
        title: "尚未選擇照片",
        message: "請先上傳一張穿搭照片",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.addToast({
        type: "warning",
        title: "尚未登入",
        message: "請登入後再上傳穿搭",
      });
      return;
    }

    setUploading(true); 

    try {
      const fileToRead = file;
      const readerResult = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(fileToRead);
      });

      const imageDataUrl = typeof readerResult === "string" ? readerResult : "";

      const tagString = tags
        .split(/[,"\s]+/)
        .filter(Boolean)
        .join(",");

      const payload = {
  // 將穿搭日期傳給後端，同時把 created_at 設為同一天（時分秒設為 00:00:00），以便後端在以 created_at 做排序/顯示時跟著這個日期
  worn_date: wornDate,
  created_at: `${wornDate}T00:00:00`,
        title: title.trim(),
        description: description.trim(),
        tags: tagString,
        image_data: imageDataUrl,
        sync_to_post: syncToPost,
        item_ids: [],
      };

      const res = await fetch(`${API_BASE}/fitting/save-outfit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text();
        console.error("save-outfit error:", t);
        let detail = t;
        try {
          detail = JSON.parse(t).detail || t;
        } catch (e) {}
        toast.addToast({
          type: "error",
          title: "儲存失敗",
          message: `儲存穿搭失敗：${detail}`,
        });
        setUploading(false);
        return;
      }

      toast.addToast({
        type: "success",
        title: syncToPost ? "已保存並發布" : "穿搭已保存",
        message: syncToPost
          ? "穿搭已保存並同步發布到貼文！"
          : "穿搭已成功保存",
      });

      // 釋放前端預覽 URL 佔用的記憶體
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  navigate("/wardrobe?tab=穿搭日記");
    } catch (err) {
      console.error("handleSave error:", err);
      toast.addToast({
        type: "error",
        title: "網路錯誤",
        message: "儲存穿搭時發生錯誤，請檢查網路連線",
      });
    } finally {
      setUploading(false);
    }
  };
  return (
    <Layout title="上傳穿搭" theme={theme} setTheme={setTheme}>
      <div className="page-wrapper">
        <div className="w-full mt-4 md:px-0 max-w-6xl mx-auto">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-slate-800">上傳今日穿搭</h1>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-xl p-4 md:p-6">
              <div className="mb-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  📸 上傳您的照片
                </h3>
                <input
                  id="outfit-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="outfit-photo"
                  className="block w-full text-center bg-white border-2 border-dashed border-pink-300 rounded-lg px-4 py-3 cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-colors"
                >
                  {previewUrl ? (
                    <div className="flex items-center justify-center gap-3">
                      <img
                        src={previewUrl}
                        alt="預覽穿搭"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <span className="text-sm text-gray-600">
                        已選擇照片，點擊可重新選擇
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="text-2xl mb-1">📷</div>
                      <div className="text-sm text-gray-600">
                        點擊上傳您的穿搭照片
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        建議使用全身照或半身穿搭照，效果更好
                      </div>
                    </div>
                  )}
                </label>
              </div>

              <div className="relative bg-gradient-to-b from-blue-50 to-gray-50 rounded-lg p-4 sm:p-8 min-h-[400px] h-[60vh] max-h-[700px] flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="穿搭預覽"
                      className="w-full h-full object-contain rounded-lg shadow-lg"
                    />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 font-medium">
                      尚未選擇穿搭照片
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-xl p-4 md:p-6">
              <h2 className="text-xl font-bold mb-4">穿搭資訊</h2>

              {/* 日期 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">日期</label>
                <input
                  type="date"
                  value={wornDate}
                  onChange={(e) => setWornDate(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* 標題 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  標題（必填）
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：週末咖啡廳約會穿搭"
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* 描述 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  穿搭描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="分享今天為什麼這樣搭配、想呈現的風格、單品故事等等..."
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* 標籤 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  # 標籤
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="例如：OOTD 牛仔褲 通勤 穿搭日記"
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <p className="text-xs text-gray-500 mt-1">
                  用空格或逗號分隔不同標籤
                </p>
              </div>

              {/* 同步到貼文 */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncToPost}
                    onChange={(e) => setSyncToPost(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium">同步發到貼文中</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  勾選後，這套穿搭會出現在你的貼文動態中
                </p>
              </div>

              {/* 按鈕列 */}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={uploading}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {uploading ? "儲存中..." : "保存穿搭"}
                </button>
                <button
                  type="button"
                  onClick={() => setAskCancel(true)}
                  className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AskModal
        open={askCancel}
        title="取消上傳穿搭？"
        message="已選擇的照片與輸入的內容將不會被保存，確定要離開嗎？"
        confirmText="確定離開"
        cancelText="繼續編輯"
        destructive
        onConfirm={() => {
          setAskCancel(false);
          if (previewUrl) URL.revokeObjectURL(previewUrl); 
          navigate("/wardrobe?tab=穿搭日記");
        }}
        onCancel={() => setAskCancel(false)}
      />
    </Layout>
  );
}