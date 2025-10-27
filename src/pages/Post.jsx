import React, { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import { useLocation } from "react-router-dom";
import Icon from "@mdi/react";
import {
  mdiImagePlusOutline,
  mdiChevronLeft,
  mdiChevronRight,
  mdiCancel,
  mdiSend,
} from "@mdi/js";
import { useToast } from "../components/ToastProvider";

function getToken() {
  return localStorage.getItem("token") || "";
}

const ALLOWED_VISIBILITY = ["public", "friends", "private"]; // 依後端需求調整

export default function CreatePost() {
  const location = useLocation();
  const { addToast } = useToast();

  // 圖片與預覽
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 單一篇文章的表單（套用到所有圖片）
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [tag, setTag] = useState("");

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 接收上一頁帶來的檔案（可選）
  useEffect(() => {
    const st = location.state;
    if (st?.files && Array.isArray(st.files) && st.files.length) {
      setFiles(st.files);
      setCurrentIndex(0);
    } else if (st?.file) {
      setFiles([st.file]);
      setCurrentIndex(0);
    }
  }, [location.state]);

  // 預覽 URL
  useEffect(() => {
    if (!files.length) {
      setPreviews([]);
      return;
    }
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  // input 加檔
  function handleFileChange(e) {
    const list = Array.from(e.target.files || []);
    const imgs = list.filter((f) => f.type?.startsWith("image/"));
    if (!imgs.length) return;
    setFiles((prev) => {
      const merged = [...prev, ...imgs];
      if (prev.length === 0) setCurrentIndex(0);
      return merged;
    });
  }

  // 拖放
  function handleDrop(e) {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files || []);
    const imgs = list.filter((f) => f.type?.startsWith("image/"));
    if (!imgs.length) return;
    setFiles((prev) => {
      const merged = [...prev, ...imgs];
      if (prev.length === 0) setCurrentIndex(0);
      return merged;
    });
  }
  function handleDragOver(e) {
    e.preventDefault();
  }

  // 刪除單張
  function removeFileAt(i) {
    setFiles((prev) => {
      const copy = [...prev];
      copy.splice(i, 1);
      return copy;
    });
    setCurrentIndex((prev) => {
      const nextMax = Math.max(0, files.length - 2);
      return Math.min(prev, nextMax);
    });
  }

  // 封裝本篇文章欄位 → 每張圖共用
  function buildFormData(file) {
    const fd = new FormData();
    let vis = (visibility || "public").toString();
    if (!ALLOWED_VISIBILITY.includes(vis)) vis = "public";

    fd.append("file", file, file.name);
    fd.append("title", (title || "").toString());
    fd.append("content", (content || "").toString());
    fd.append("visibility", vis);
    fd.append("tag", (tag || "").toString());
    return fd;
  }

  async function performSingleUpload(fd) {
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch("http://localhost:8000/api/v1/posts/", {
      method: "POST",
      headers,
      body: fd,
    });
    return res;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (uploading) return;
    if (!files.length) {
      addToast({ type: "warning", title: "尚未選擇照片", message: "請先上傳照片再完成操作。" });
      return;
    }

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const fd = buildFormData(files[i]);
        const res = await performSingleUpload(fd);
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          let parsed = null;
          try { parsed = JSON.parse(text); } catch {}
          const errMsg = parsed?.detail || text || `${res.status} ${res.statusText}`;
          throw new Error(`第 ${i + 1} 張上傳失敗：${errMsg}`);
        }
      }

      addToast({
        type: "success",
        title: "發佈完成",
        message: `已成功發佈（共 ${files.length} 張）。`,
        autoDismiss: 3000,
      });
      // ✅ 不跳轉：維持在本頁
      // 你也可以選擇清空圖片：setFiles([]); setCurrentIndex(0);
    } catch (err) {
      console.error("upload error:", err);
      addToast({
        type: "error",
        title: "上傳失敗",
        message: err.message || String(err),
        autoDismiss: 6000,
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Layout title="上傳貼文">
      <div className="page-wrapper h-full overflow-y-auto py-8">
        <div className="max-w-5xl mt-6 px-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* 左：預覽與拖放 */}
            <div className="md:col-span-7 space-y-4">
              <div
                className="w-full aspect-[4/3] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 relative flex items-center justify-center overflow-hidden"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
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
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 px-3 py-1 rounded-md text-sm text-indigo-600 shadow"
                >
                  選擇照片
                </button>

                {previews.length === 0 ? (
                  <div className="text-center p-6 pointer-events-none">
                    <Icon path={mdiImagePlusOutline} size={2.5} className="text-indigo-500 mx-auto" />
                    <p className="mt-2 font-semibold text-slate-700">點擊此處或拖曳圖片至此</p>
                    <p className="text-sm text-slate-500">可一次上傳多張圖片</p>
                  </div>
                ) : (
                  <>
                    <img
                      src={previews[currentIndex]}
                      alt="預覽"
                      className="object-contain w-full h-full block"
                    />
                    {previews.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setCurrentIndex((v) => (v - 1 + previews.length) % previews.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2"
                          aria-label="上一張"
                        >
                          <Icon path={mdiChevronLeft} size={1} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentIndex((v) => (v + 1) % previews.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2"
                          aria-label="下一張"
                        >
                          <Icon path={mdiChevronRight} size={1} />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* 縮圖列 */}
              {previews.length > 0 && (
                <div className="bg-white p-3 rounded-2xl shadow-md">
                  <div className="text-sm text-slate-600 mb-2">
                    共 {previews.length} 張，當前預覽第 {currentIndex + 1} 張
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {previews.map((url, i) => (
                      <div
                        key={i}
                        className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${
                          i === currentIndex ? "border-indigo-600" : "border-transparent"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setCurrentIndex(i)}
                          className="absolute inset-0"
                          aria-label={`預覽第 ${i + 1} 張`}
                        />
                        <img src={url} alt={`thumb-${i}`} className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFileAt(i);
                          }}
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

            {/* 右：單一表單（套用到所有圖片） */}
            <div className="md:col-span-5">
              <aside className="bg-white rounded-2xl p-6 shadow-xl sticky top-6 space-y-5">
                <div>
                  <label htmlFor="post-title" className="block text-sm font-medium text-slate-700">標題（選填）</label>
                  <input
                    id="post-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="為您的貼文下個標題吧"
                    className="mt-1 w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition"
                  />
                </div>

                <div>
                  <label htmlFor="post-content" className="block text-sm font-medium text-slate-700">想要分享什麼？</label>
                  <textarea
                    id="post-content"
                    rows="7"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="分享您的穿搭心得、單品故事..."
                    className="mt-1 w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">可見度</label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="mt-1 w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition bg-white"
                    >
                      <option value="public">公開</option>
                      <option value="friends">好友</option>
                      <option value="private">私人</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="post-tags" className="block text-sm font-medium text-slate-700"># 標籤</label>
                    <input
                      id="post-tags"
                      type="text"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      placeholder="例如：OOTD 帽子 藍色穿搭"
                      className="mt-1 w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">用空格或逗號分隔不同標籤</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      // 清空全部
                      setFiles([]);
                      setPreviews([]);
                      setCurrentIndex(0);
                      setTitle("");
                      setContent("");
                      setVisibility("public");
                      setTag("");
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-300 rounded-lg py-2.5 font-semibold transition hover:bg-slate-50"
                  >
                    <Icon path={mdiCancel} size={0.9} />
                    <span>清空</span>
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg py-2.5 font-semibold transition hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Icon path={mdiSend} size={0.9} />
                    <span>{uploading ? "發佈中..." : "發佈"}</span>
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
