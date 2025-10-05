// src/pages/Post.jsx
import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

export default function Post({ theme, setTheme }) {
  const navigate = useNavigate();
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [postPreview, setPostPreview] = useState(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!postImage) { setPostPreview(null); return; }
    const url = URL.createObjectURL(postImage);
    setPostPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [postImage]);

  async function handlePostSubmit(e) {
    e.preventDefault();
    if (posting) return;
    if (!postText.trim() && !postImage) {
      alert("請輸入貼文或上傳圖片");
      return;
    }

    setPosting(true);
    try {
      const fd = new FormData();
      fd.append("content", postText);
      if (postImage) fd.append("file", postImage);

      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || JSON.stringify(err));
      }

      await res.json();
      alert("發文成功！");
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert("發文失敗：" + err.message);
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="page-wrapper">
      <Header title="上傳貼文" theme={theme} setTheme={setTheme} />
         <div className="max-w-6xl mx-auto px-4"></div>
          <form onSubmit={handlePostSubmit} className="mt-4 space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="想要分享什麼？"
                className="w-full border rounded-lg p-3 min-h-[120px] resize-none"
              />

              <div className="mt-3 flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPostImage(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="px-3 py-2 border rounded-lg">上傳圖片</div>
                </label>

                {postPreview && (
                  <div className="w-20 h-20 bg-gray-50 rounded-md overflow-hidden">
                    <img src={postPreview} alt="post preview" className="object-cover w-full h-full" />
                  </div>
                )}

                <div className="ml-auto flex items-center gap-2">
                  <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border rounded-lg">取消</button>
                  <button type="submit" disabled={posting} className={`px-4 py-2 rounded-lg ${posting ? "bg-gray-400" : "bg-indigo-600 text-white"}`}>
                    {posting ? "發文中..." : "發佈"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
  );
}
