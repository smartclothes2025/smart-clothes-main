// src/pages/Outfit.jsx 
import React, { useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useToast } from "../components/ToastProvider";
import AskModal from "../components/AskModal";

const API_BASE =
  import.meta.env?.VITE_API_BASE ||
  "https://cometical-kyphotic-deborah.ngrok-free.dev";

export default function Outfit({ theme, setTheme }) {
  const navigate = useNavigate();
  const toast = useToast();

  // 表單欄位
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [syncToPost, setSyncToPost] = useState(false);
  const [wornDate, setWornDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // 上傳穿搭照片
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // 狀態
  const [saving, setSaving] = useState(false);
  const [askCancel, setAskCancel] = useState(false);

  // 處理照片上傳（前端預覽）
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  // 上傳圖片到後端，取得 image_url
  const uploadOutfitImage = async (token) => {
    if (!file) {
      toast.addToast({
        type: "error",
        title: "尚未選擇照片",
        message: "請先上傳一張穿搭照片",
      });
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      // TODO: 🔧 如果你的後端路徑不同，在這裡改
      const res = await fetch(`${API_BASE}/uploads/outfit-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const t = await res.text();
        console.error("上傳穿搭圖片失敗：", t);
        toast.addToast({
          type: "error",
          title: "圖片上傳失敗",
          message: "無法上傳穿搭照片，請稍後再試",
        });
        return null;
      }

      const data = await res.json();
      if (!data.url) {
        toast.addToast({
          type: "error",
          title: "圖片上傳錯誤",
          message: "伺服器沒有回傳圖片網址",
        });
        return null;
      }

      return data.url;
    } catch (err) {
      console.error("uploadOutfitImage error:", err);
      toast.addToast({
        type: "error",
        title: "網路錯誤",
        message: "上傳圖片時發生錯誤：" + err.message,
      });
      return null;
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.addToast({
        type: "error",
        title: "缺少標題",
        message: "請為這套穿搭取一個標題 ✨",
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

    setSaving(true);

    try {
      // 1️⃣ 先上傳圖片，取得 image_url
      const imageUrl = await uploadOutfitImage(token);
      if (!imageUrl) {
        setSaving(false);
        return;
      }

      // 2️⃣ 呼叫 /fitting/save-outfit 儲存穿搭記錄
      const tagString = tags
        .split(/[,\s]+/)
        .filter(Boolean)
        .join(",");

      const payload = {
        worn_date: wornDate, // 使用表單選的日期
        title: title.trim(),
        description: description.trim(),
        tags: tagString,
        image_url: imageUrl,
        sync_to_post: syncToPost,
        // 純上傳穿搭照片，因此給空陣列
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
        toast.addToast({
          type: "error",
          title: "儲存失敗",
          message: "儲存穿搭時發生錯誤，請稍後再試",
        });
        setSaving(false);
        return;
      }

      toast.addToast({
        type: "success",
        title: syncToPost ? "已保存並發布" : "穿搭已保存",
        message: syncToPost
          ? "穿搭已保存並同步發布到貼文！"
          : "穿搭已成功保存 🎉",
      });

      setSaving(false);
      navigate("/wardrobe");
    } catch (err) {
      console.error("handleSave error:", err);
      toast.addToast({
        type: "error",
        title: "網路錯誤",
        message: "儲存穿搭時發生錯誤：" + err.message,
      });
      setSaving(false);
    }
  };

  return (
    <Layout title="上傳穿搭" theme={theme} setTheme={setTheme}>
      <div className="page-wrapper">
        <div className="w-full mt-4 md:px-0 max-w-6xl mx-auto">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-slate-800">上傳今日穿搭</h1>
          </div>

          {/* 🔥 左右兩欄：左邊上傳＋預覽，右邊表單 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左側：上傳 & 預覽 */}
            <div className="bg-white rounded-xl shadow-xl p-4 md:p-6">
              {/* 上傳區：粉紅框，風格跟虛擬試衣一樣 */}
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

              {/* 大圖預覽區：仿 VirtualFitting 下半部 */}
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

            {/* 右側：表單區域 */}
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
                  disabled={saving}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {saving ? "儲存中..." : "保存穿搭"}
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

      {/* 取消確認 */}
      <AskModal
        open={askCancel}
        title="取消上傳穿搭？"
        message="已選擇的照片與輸入的內容將不會被保存，確定要離開嗎？"
        confirmText="確定離開"
        cancelText="繼續編輯"
        destructive
        onConfirm={() => {
          setAskCancel(false);
          navigate("/wardrobe");
        }}
        onCancel={() => setAskCancel(false)}
      />
    </Layout>
  );
}
