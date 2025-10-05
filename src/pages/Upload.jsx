// src/pages/Upload.jsx
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';

export default function Upload({ theme, setTheme }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    category: "上衣",
    color: "",
    material: "棉",
    style: "休閒",
    size: "M",
    brand: ""
  });
  const [autoTag, setAutoTag] = useState(true);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [postOpen, setPostOpen] = useState(false);
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [postPreview, setPostPreview] = useState(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

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
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      alert('請上傳圖片檔（jpg, png）');
      return;
    }
    setFile(f);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (uploading) return;
    if (!file) {
      alert('請先上傳照片');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', form.name);
      fd.append('category', form.category);
      fd.append('color', form.color);
      fd.append('material', form.material);
      fd.append('style', form.style);
      fd.append('size', form.size);
      fd.append('brand', form.brand);
      fd.append('auto_tag', autoTag ? '1' : '0');

      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: fd
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || JSON.stringify(err));
      }

      await res.json();
      alert('上傳成功！');
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert('上傳失敗：' + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handlePostSubmit(e) {
    e.preventDefault();
    if (posting) return;
    if (!postText.trim() && !postImage) {
      alert('請輸入貼文或上傳圖片');
      return;
    }

    setPosting(true);
    try {
      const fd = new FormData();
      fd.append('content', postText);
      if (postImage) fd.append('file', postImage);

      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: fd
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || JSON.stringify(err));
      }

      await res.json();
      alert('發文成功！');
      setPostOpen(false);
      setPostText('');
      setPostImage(null);
      setPostPreview(null);
    } catch (err) {
      console.error(err);
      alert('發文失敗：' + err.message);
    } finally {
      setPosting(false);
    }
  }

  function handleGoQuickAdd() {
    navigate('/quick-add');
  }

  function handleOpenPost() {
    setPostOpen(true);
  }

  return (
    <div className="min-h-full pb-32 pt-2 md:pb-0 px-2">
      <Header title="新增衣物" theme={theme} setTheme={setTheme} />
      <div className="lg:pl-72">
        <div className="max-w-6xl mx-auto px-4 mt-4">
          {/* 使用 12 欄格：左 8 欄為圖片/大區塊，右 4 欄為欄位 */}
          <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="block text-sm text-gray-600 mb-2">上傳照片</label>
                <div className="mt-2 h-64 bg-gray-50 rounded-md flex items-center justify-center border border-dashed">
                  {!preview ? (
                    <label className="flex flex-col items-center gap-2 cursor-pointer">
                      <div className="text-sm text-gray-500">拖曳或點擊上傳</div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <img src={preview} alt="preview" className="object-contain h-60 w-full" />
                  )}
                </div>

                {preview && (
                  <div className="mt-3 flex items-center gap-3">
                    <button type="button" className="text-sm underline" onClick={() => { setFile(null); setPreview(null); }}>
                      移除照片
                    </button>
                    <span className="text-sm text-gray-500">預覽中</span>
                  </div>
                )}
              </div>

              {/* 可放一些額外說明或大區塊 */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-medium mb-2">上傳說明</h3>
                <p className="text-sm text-gray-500">建議使用清晰的正面照片，背景簡潔。系統會自動辨識顏色與類別（若啟用 AI 自動分類）。</p>
              </div>
            </div>

            {/* 右側欄位 */}
            <div className="col-span-12 lg:col-span-4">
              <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">名稱</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full mt-1 p-3 border rounded-lg"
                    placeholder="例：白色T恤"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">類別</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-3 border rounded-lg"
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
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder="顏色"
                    className="p-3 border rounded-lg"
                  />
                  <input
                    value={form.material}
                    onChange={(e) => setForm({ ...form, material: e.target.value })}
                    placeholder="材質"
                    className="p-3 border rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={form.style}
                    onChange={(e) => setForm({ ...form, style: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="品牌"
                    className="w-full p-3 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={autoTag}
                      onChange={(e) => setAutoTag(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">AI 自動分類（模擬 90%）</span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={uploading}
                    className={`flex-1 py-3 rounded-lg ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white'}`}>
                    {uploading ? '上傳中...' : '完成'}
                  </button>

                  <button type="button" onClick={() => navigate(-1)} className="flex-1 border py-3 rounded-lg">
                    取消
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* 底部浮動 sheet（大按鈕） - 微調 bottom 避免擋住內容
      <div className="fixed left-1/2 transform -translate-x-1/2 bottom-8 w-[92%] max-w-3xl lg:bottom-12">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="w-20 h-1.5 bg-gray-300 rounded-full mx-auto mb-3"></div>
          <div className="flex justify-between gap-4 px-2">
            <button
              onClick={handleGoQuickAdd}
              className="flex-1 flex flex-col items-center gap-3 py-4 bg-white border rounded-xl shadow-sm hover:shadow-md"
            >
              <div className="w-16 h-16 rounded-lg border flex items-center justify-center text-2xl">
                <Camera className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium">快速新增</div>
              <div className="text-xs text-gray-400">進入快速上傳頁</div>
            </button>

            <button
              onClick={handleOpenPost}
              className="flex-1 flex flex-col items-center gap-3 py-4 bg-white border rounded-xl shadow-sm hover:shadow-md"
            >
              <div className="w-16 h-16 rounded-lg border flex items-center justify-center text-2xl">✍️</div>
              <div className="text-sm font-medium">發文</div>
              <div className="text-xs text-gray-400">分享穿搭/心得</div>
            </button>
          </div>
        </div>
      </div> */}

      {/* 發文 Modal */}
      {postOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPostOpen(false)} />
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
                  <button type="button" onClick={() => setPostOpen(false)} className="px-4 py-2 border rounded-lg">取消</button>
                  <button type="submit" disabled={posting} className={`px-4 py-2 rounded-lg ${posting ? 'bg-gray-400' : 'bg-indigo-600 text-white'}`}>
                    {posting ? '發文中...' : '發佈'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
