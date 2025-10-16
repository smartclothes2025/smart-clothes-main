import React, { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout"; 
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider"; 
import Icon from "@mdi/react";
import { mdiImagePlus, mdiSend, mdiCancel } from "@mdi/js";

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

      // ！！！注意：請將 API 端點換成您後端處理貼文的實際路徑！！！
      const response = await fetch("http://localhost:8000/api/v1/posts/", {
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
      <div className="page-wrapper py-8">
        <div className="max-w-5xl mx-auto px-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

            <div className="md:col-span-7 space-y-4">
              <div 
                className="w-full aspect-square bg-gray-50 rounded-lg border-2 border-dashed relative flex items-center justify-center overflow-hidden"
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
                {previewUrls.length === 0 ? (
                  <div className="text-center p-6 pointer-events-none">
                    <Icon path={mdiImagePlus} size={2} className="text-gray-400 mx-auto" />
                    <p className="mt-2 font-semibold text-gray-700">點擊此處或拖曳圖片至此</p>
                    <p className="text-sm text-gray-500">最多可上傳多張照片</p>
                  </div>
                ) : (
                  <img src={previewUrls[currentIndex]} alt="預覽" className="object-contain w-full h-full block" />
                )}
              </div>
              
              {previewUrls.length > 0 && (
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <div className="text-sm text-gray-600 mb-2">共 {previewUrls.length} 張，當前預覽第 {currentIndex + 1} 張</div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {previewUrls.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentIndex(i)}
                        className={`flex-shrink-0 relative w-20 h-20 rounded-md overflow-hidden border-2 ${i === currentIndex ? "border-blue-500" : "border-transparent"}`}
                      >
                        <img src={url} alt={`thumb-${i}`} className="object-cover w-full h-full" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-5">
              <aside className="bg-white rounded-xl p-6 shadow-sm sticky top-6 space-y-5">
                <div>
                  <label htmlFor="post-title" className="block text-sm font-medium text-gray-700 mb-1">標題 (選填)</label>
                  <input
                    id="post-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="為您的貼文下個標題吧"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
                
                <div>
                  <label htmlFor="post-content" className="block text-sm font-medium text-gray-700 mb-1">想要分享什麼？</label>
                  <textarea
                    id="post-content"
                    rows="8"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="分享您的穿搭心得、單品故事..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label htmlFor="post-tags" className="block text-sm font-medium text-gray-700 mb-1"># 標籤</label>
                  <input
                    id="post-tags"
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="例如：OOTD 帽子 藍色穿搭"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                   <p className="text-xs text-gray-500 mt-1">用空格或逗號分隔不同標籤</p>
                </div>
                
                <div className="flex items-center gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 rounded-lg py-3 font-semibold transition hover:bg-gray-200"
                  >
                    <Icon path={mdiCancel} size={0.9} />
                    <span>取消</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-lg py-3 font-semibold transition hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
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