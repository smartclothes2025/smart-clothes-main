import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useLocation, useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";

export default function Upload({ theme, setTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    name: "",
    category: "上衣",
    color: "",
    material: "棉",
    style: "休閒",
    size: "M",
    brand: "",
  });

  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [previewList, setPreviewList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [removeBg, setRemoveBg] = useState(false);
  const [aiDetect, setAiDetect] = useState(false);

  const [postOpen, setPostOpen] = useState(false);
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [postPreview, setPostPreview] = useState(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!files.length) {
      setPreviewList([]);
      return;
    }
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewList(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  useEffect(() => {
    const st = location.state;
    if (st?.files && Array.isArray(st.files) && st.files.length) {
      setFiles(st.files);
      const p = Number.isInteger(st.primaryIndex) ? Math.min(Math.max(0, st.primaryIndex), st.files.length - 1) : 0;
      setPrimaryIndex(p);
      setCurrentIndex(p);
      setFile(st.files[p]);
    } else if (st?.file) {
      setFiles([st.file]);
      setPrimaryIndex(0);
      setCurrentIndex(0);
      setFile(st.file);
    }
    if (typeof st?.removeBg === "boolean") {
      setRemoveBg(st.removeBg);
    }
    if (typeof st?.aiDetect === "boolean") {
      setAiDetect(st.aiDetect);
    }
  }, [location.state]);

  useEffect(() => {
    if (!postImage) {
      setPostPreview(null);
      return;
    }
    const url = URL.createObjectURL(postImage);
    setPostPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [postImage]);

  function handleFileChange(e) {
    const list = Array.from(e.target.files || []);
    const imgs = list.filter((f) => f.type?.startsWith("image/"));
    if (!imgs.length) return;
    setFiles((prev) => {
      const merged = [...prev, ...imgs];
      if (prev.length === 0) {
        setPrimaryIndex(0);
        setCurrentIndex(0);
        setFile(imgs[0]);
      }
      return merged;
    });
  }

  // ...existing code...
  async function handleSubmit(e) {
    e.preventDefault();
    if (uploading) return;
    if (!files.length) {
      alert("請先上傳照片");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();

      // append 所有檔案 (後端期望欄位名為 "files")
      files.forEach((f, idx) => {
        // 前端決定哪個當主圖/次圖可由後端依 stored order 處理或加入額外 meta
        fd.append("files", f, f.name);
      });

      fd.append("name", form.name || "");
      fd.append("category", form.category || "");
      fd.append("color", form.color || "");

      const tagsArr = [];
      if (form.style) tagsArr.push(form.style);
      if (form.brand) tagsArr.push(form.brand);
      fd.append("tags", JSON.stringify(tagsArr));

      const attrs = {
        material: form.material || "",
        size: form.size || "",
        brand: form.brand || ""
      };
      fd.append("attributes", JSON.stringify(attrs));
      fd.append("remove_bg", removeBg ? "1" : "0");
      fd.append("ai_detect", aiDetect ? "1" : "0");

      const token = localStorage.getItem("token") || "";
      if (token) fd.append("token", token);
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      console.log("Upload debug:", { filesCount: files.length, primaryIndex, tokenExists: !!token });

      const res = await fetch("http://localhost:8000/api/v1/upload/", {
        method: "POST",
        headers,
        body: fd,
      });

      if (!res.ok) {
        // 先抓 response headers / status
        console.error("Upload status", res.status, res.statusText);
        // 先讀 text，再嘗試 parse JSON，最後把原始與解析結果都印出來
        const text = await res.text().catch(() => "");
        console.error("Upload response raw text:", text);
        let parsed = null;
        try {
          parsed = JSON.parse(text);
          console.error("Upload response parsed json:", parsed);
        } catch (e) {
          console.warn("Response is not JSON");
        }
        // Throw 一個包含完整訊息的 Error（確保是字串）
        const errMsg = parsed?.detail ? parsed.detail : (text || `${res.status} ${res.statusText}`);
        throw new Error(errMsg);
      }
  
      await res.json();
      alert("上傳成功！");
      navigate(-1);
      
    } catch (err) {
      console.error("upload error:", err);
      alert("上傳失敗：" + (err.message || String(err)));
    } finally {
      setUploading(false);
    }
  }


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
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || JSON.stringify(err));
      }

      await res.json();
      alert("發文成功！");
      setPostOpen(false);
      setPostText("");
      setPostImage(null);
      setPostPreview(null);
    } catch (err) {
      alert("發文失敗：" + (err.message || err));
    } finally {
      setPosting(false);
    }
  }

  function handleGoQuickAdd() {
    navigate("/quick-add");
  }

  function handleOpenPost() {
    setPostOpen(true);
  }

  return (
    <Layout title="新增衣物">
      <div className="page-wrapper">
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="block text-sm text-gray-600 mb-2">
                  預覽照片
                </label>
                <div className="w-full max-w-[480px] mx-auto aspect-square bg-gray-50 rounded-lg flex items-center justify-center border border-dashed relative overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    aria-label="上傳照片"
                  />

                  {previewList.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 pointer-events-none">
                      <div className="text-sm text-gray-500">
                        尚未選擇照片，點擊方框或使用上一步選擇/編輯照片
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-2 rounded-lg border flex items-center gap-2 bg-white">
                          <Camera className="w-5 h-5" />
                          <span className="text-sm">選擇圖片</span>
                        </div>
                        <button
                          type="button"
                          className="px-3 py-2 rounded-lg border pointer-events-auto"
                          onClick={() => navigate("/upload/select")}
                        >
                          重新上傳（編輯）
                        </button>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={previewList[currentIndex]}
                      alt="preview"
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>

                {previewList.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-600">共 {previewList.length} 張，當前第 {currentIndex + 1} 張</div>
                      <button
                        type="button"
                        className={`px-3 py-1 rounded border ${primaryIndex === currentIndex ? 'bg-black text-white border-black' : 'border-gray-300'}`}
                        onClick={() => {
                          setPrimaryIndex(currentIndex);
                          setFile(files[currentIndex]);
                        }}
                      >
                        設為主圖
                      </button>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto">
                      {previewList.map((u, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCurrentIndex(i)}
                          className={`relative w-20 h-20 rounded overflow-hidden border ${i === currentIndex ? 'border-blue-600' : 'border-gray-200'}`}
                        >
                          <img src={u} alt={`thumb-${i}`} className="object-cover w-full h-full" />
                          {i === primaryIndex && (
                            <span className="absolute top-1 left-1 bg-black text-white text-[10px] px-1 rounded">主圖</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            <div className="col-span-12 lg:col-span-4">
              <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-4 items-center">
                  <label className="text-sm text-gray-600">名稱</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="p-3 border rounded-lg"
                    placeholder="例：白色T恤"
                  />

                  <label className="text-sm text-gray-600">類別</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="p-3 border rounded-lg"
                  >
                    <option>上衣</option>
                    <option>褲裝</option>
                    <option>裙子</option>
                    <option>連衣裙</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={form.color}
                    onChange={(e) =>
                      setForm({ ...form, color: e.target.value })
                    }
                    placeholder="顏色"
                    className="p-3 border rounded-lg"
                  />
                  <input
                    value={form.material}
                    onChange={(e) =>
                      setForm({ ...form, material: e.target.value })
                    }
                    placeholder="材質"
                    className="p-3 border rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={form.style}
                    onChange={(e) =>
                      setForm({ ...form, style: e.target.value })
                    }
                    placeholder="風格"
                    className="p-3 border rounded-lg"
                  />
                  <input
                    value={form.size}
                    onChange={(e) => setForm({ ...form, size: e.target.value })}
                    placeholder="尺寸"
                    className="p-3 border rounded-lg"
                  />
                </div>

                <div>
                  <input
                    value={form.brand}
                    onChange={(e) =>
                      setForm({ ...form, brand: e.target.value })
                    }
                    placeholder="品牌"
                    className="w-full p-3 border rounded-lg"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={uploading}
                    className={`flex-1 py-3 rounded-lg ${uploading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 text-white"
                      }`}
                  >
                    {uploading ? "上傳中..." : "完成"}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/upload/edit", { state: { files: files, primaryIndex, removeBg, aiDetect } })}
                    className="flex-1 border py-3 rounded-lg"
                  >
                    上一步
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {postOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setPostOpen(false)}
            />
            <div className="relative w-full max-w-3xl bg-white rounded-t-2xl p-4 shadow-xl">
              <div className="w-16 h-1.5 bg-gray-300 rounded-full mx-auto mb-3"></div>
              <form onSubmit={handlePostSubmit} className="space-y-3 pb-6">
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="想要分享什麼？（可輸入文字或上傳一張圖片）"
                  className="w-full border rounded-lg p-3 min-h-[120px] resize-none"
                />

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setPostImage(e.target.files?.[0] || null)
                      }
                      className="hidden"
                    />
                    <div className="px-3 py-2 border rounded-lg">上傳圖片</div>
                  </label>

                  {postPreview && (
                    <div className="w-20 h-20 bg-gray-50 rounded-md overflow-hidden">
                      <img
                        src={postPreview}
                        alt="post preview"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}

                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPostOpen(false)}
                      className="px-4 py-2 border rounded-lg"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={posting}
                      className={`px-4 py-2 rounded-lg ${posting ? "bg-gray-400" : "bg-indigo-600 text-white"
                        }`}
                    >
                      {posting ? "發文中..." : "發佈"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}