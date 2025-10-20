import React, { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";
import Icon from "@mdi/react";
import { mdiImagePlusOutline, mdiSend, mdiCancel } from "@mdi/js";

function getToken() {
  return localStorage.getItem("token") || "";
}

export default function CreatePost() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!files.length) {
      setPreviewUrls([]);
      return;
    }
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const imageFiles = selectedFiles.filter((file) =>
      file.type.startsWith("image/")
    );
    if (!imageFiles.length) return;

    setFiles((prevFiles) => {
      const newFiles = [...prevFiles, ...imageFiles];
      if (prevFiles.length === 0) setCurrentIndex(0);
      return newFiles;
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    const imageFiles = droppedFiles.filter((file) =>
      file.type.startsWith("image/")
    );
    if (!imageFiles.length) return;

    setFiles((prevFiles) => {
      const newFiles = [...prevFiles, ...imageFiles];
      if (prevFiles.length === 0) setCurrentIndex(0);
      return newFiles;
    });
  };

  const handleDragEnter = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };

  const removeFileAt = (index) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // adjust currentIndex
      if (next.length === 0) setCurrentIndex(0);
      else if (index <= currentIndex && currentIndex > 0) setCurrentIndex((ci) => Math.max(0, ci - 1));
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (files.length === 0) {
      addToast({
        type: "warning",
        title: "尚未選擇圖片",
        message: "請至少上傳一張圖片。",
      });
      return;
    }
    if (!content.trim()) {
      addToast({
        type: "warning",
        title: "內容不得為空",
        message: "請分享一些文字內容吧！",
      });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    const tagsArray = tags.split(/[\s,]+/).filter(Boolean);
    formData.append("tags", JSON.stringify(tagsArray));

    files.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

      const response = await fetch(`${API_BASE}/posts/`, { 
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "未知的伺服器錯誤" }));
        throw new Error(errorData.detail || `錯誤碼: ${response.status}`);
      }

      addToast({
        type: "success",
        title: "發佈成功！",
        message: "您的貼文已成功分享。",
        autoDismiss: 3000,
      });
      navigate("/");

    } catch (err) {
      console.error("Post creation error:", err);
      addToast({
        type: "error",
        title: "發佈失敗",
        message: err.message || "發生未知錯誤，請稍後再試。",
        autoDismiss: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="上傳貼文">
      <div className="page-wrapper h-full overflow-y-auto py-8">
        <div className="max-w-5xl mt-6 px-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-6 space-y-4">
              <div
                className="w-full aspect-[4/3] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 relative flex items-center justify-center overflow-hidden"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  aria-label="上傳照片"
                />
                {/* visible select button for keyboard users */}
                <button type="button" onClick={() => fileInputRef.current && fileInputRef.current.click()} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 px-3 py-1 rounded-md text-sm text-indigo-600 shadow">選擇照片</button>
                {previewUrls.length === 0 ? (
                  <div className="text-center p-6 pointer-events-none">
                    <Icon path={mdiImagePlusOutline} size={2.5} className="text-indigo-500 mx-auto" />
                    <p className="mt-2 font-semibold text-slate-700">點擊此處或拖曳圖片至此</p>
                    <p className="text-sm text-slate-500">最多可上傳多張照片</p>
                  </div>
                ) : (
                  <img src={previewUrls[currentIndex]} alt="預覽" className="object-contain w-full h-full block" />
                )}
              </div>

              {previewUrls.length > 0 && (
                <div className="bg-white p-3 rounded-2xl shadow-md">
                  <div className="text-sm text-slate-600 mb-2">共 {previewUrls.length} 張，當前預覽第 {currentIndex + 1} 張</div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {previewUrls.map((url, i) => (
                      <div key={i} className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${i === currentIndex ? "border-indigo-600" : "border-transparent"}`}>
                        <button
                          type="button"
                          onClick={() => setCurrentIndex(i)}
                          className="absolute inset-0"
                          aria-label={`預覽第 ${i + 1} 張`}
                        />
                        <img src={url} alt={`thumb-${i}`} className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFileAt(i); }}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          aria-label={`移除第 ${i + 1} 張`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-5">
              <aside className="bg-white rounded-2xl p-6 shadow-xl sticky top-6 space-y-5">
                <div>
                  <label>標題 (選填)</label>
                  <input
                    id="post-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="為您的貼文下個標題吧"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition"
                  />
                </div>

                <div>
                  <label>想要分享什麼？</label>
                  <textarea
                    id="post-content"
                    rows="7"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="分享您的穿搭心得、單品故事..."
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition"
                  />
                </div>

                <div>
                  {/* [!!] 樣式修改：label 樣式 */}
                  <label># 標籤</label>
                  {/* [!!] 樣式修改：input 樣式 */}
                  <input
                    id="post-tags"
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="例如：OOTD 帽子 藍色穿搭"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition"
                  />
                  {/* [!!] 樣式修改：text-slate-500 */}
                  <p className="text-xs text-slate-500 mt-1.5">用空格或逗號分隔不同標籤</p>
                </div>

                {/* [!!] 按鈕 (樣式修改) */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    // [!!] 樣式修改：次要按鈕 (白底灰框)
                    className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-300 rounded-lg py-2.5 font-semibold transition hover:bg-slate-50"
                  >
                    <Icon path={mdiCancel} size={0.9} />
                    <span>取消</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    // [!!] 樣式修改：主要按鈕 (indigo)
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg py-2.5 font-semibold transition hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Icon path={mdiSend} size={0.9} />
                    <span>{isSubmitting ? "發佈中..." : "發佈"}</span>
                  </button>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}