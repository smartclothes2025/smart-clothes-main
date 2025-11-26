// src/components/OutfitModal.jsx 
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import AskModal from "../AskModal";
import { useToast } from "../ToastProvider";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  SparklesIcon,
  TagIcon,
  PencilSquareIcon,
  UserCircleIcon,
} from "@heroicons/react/20/solid";

function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith("gs://")) {
    const withoutScheme = url.replace("gs://", "");
    const [bucket, ...parts] = withoutScheme.split("/");
    const encodedPath = parts.map(encodeURIComponent).join("/");
    return `https://storage.googleapis.com/${bucket}/${encodedPath}`;
  }
  return url;
}

/**
 * props:
 *  - date: Date 或可被 new Date() 的字串
 *  - outfit: { img / image_url / name / description / tags ... }
 *  - onClose: function()
 *  - onUploadUserImage?: (file) => void   // 可選：如果你要在父層把實穿照上傳到後端，可以用這個
 */
export default function OutfitModal({
  date,
  outfit,
  onClose,
  onUploadUserImage,
}) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [askDelete, setAskDelete] = useState(false);
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [localOutfit, setLocalOutfit] = useState(outfit || {});
  const [editTitle, setEditTitle] = useState(outfit?.name || "");
  const [editDescription, setEditDescription] = useState(outfit?.description || "");
  const [editTags, setEditTags] = useState(outfit?.tags || "");

  if (!date) return null;

  // 日期 label
  const dateLabel = new Date(date).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const imageUrl = resolveImageUrl(outfit?.img || outfit?.image_url || null);

  const tags = outfit?.tags
    ? outfit.tags.split(/[,\s]+/).filter(Boolean)
    : [];

  // 使用者自行上傳的實穿照片（僅在這個 modal 內預覽）
  const [userPhotoFile, setUserPhotoFile] = useState(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState(null);

  useEffect(() => {
    const y = window.scrollY;
    const x = window.scrollX;
    document.body.style.position = "fixed";
    document.body.style.top = `-${y}px`;
    document.body.style.left = `-${x}px`;
    document.body.style.right = "0";
    document.body.style.width = "100%";

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      window.scrollTo(x, y);
    };
  }, []);

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleUserPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUserPhotoFile(file);
    const url = URL.createObjectURL(file);
    setUserPhotoPreview(url);

    if (typeof onUploadUserImage === "function") {
      onUploadUserImage(file);
    }
  };

  const handleGoNewOutfit = () => {
    // 關閉當前 Modal 再跳轉，並把目前 modal 的 date 傳過去（yyyy-MM-dd）
    onClose(false);
    try {
      const d = new Date(date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      navigate('/outfit/upload', { state: { wornDate: dateStr } });
    } catch (e) {
      navigate('/outfit/upload');
    }
  };

  // 編輯：把目前 outfit 與日期帶到 upload page（upload page 可檢查 location.state.outfitToEdit）
  const handleEdit = () => {
    // 直接在 modal 內編輯，切換到編輯模式並初始化編輯欄位
    setIsEditing(true);
    setLocalOutfit(outfit || {});
    setEditTitle(outfit?.name || "");
    setEditDescription(outfit?.description || "");
    setEditTags(outfit?.tags || "");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // 重置欄位
    setEditTitle(localOutfit?.name || "");
    setEditDescription(localOutfit?.description || "");
    setEditTags(localOutfit?.tags || "");
    setUserPhotoFile(null);
    if (userPhotoPreview) {
      URL.revokeObjectURL(userPhotoPreview);
      setUserPhotoPreview(null);
    }
  };

  const handleSaveEdit = async () => {
    const id = localOutfit?.id || localOutfit?.post_id || localOutfit?._id;
    if (!id) {
      toast?.addToast?.({ type: 'error', title: '更新失敗', message: '找不到要更新的項目 id' });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast?.addToast?.({ type: 'warning', title: '未登入', message: '請先登入' });
      return;
    }

    // 準備標籤字串
    const tagString = (editTags || '')
      .split(/[,"\s]+/)
      .filter(Boolean)
      .join(',');

    setDeleting(true); // reuse deleting as saving flag to show disabled
    const API_BASE = import.meta.env?.VITE_API_BASE || 'https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1';

    const tryPut = async (url, body) => {
      try {
        let res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });

        // 若 PUT 被 server 拒絕 (405)，改用 PATCH
        if (res.status === 405) {
          res = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
          });
        }

        if (!res.ok) {
          // 嘗試讀取錯誤內容方便除錯
          let detail = null;
          try {
            detail = await res.text();
          } catch (e) {
            detail = String(res.statusText || res.status);
          }
          return { __error: true, status: res.status, detail };
        }

        const data = await res.json();
        return data;
      } catch (e) {
        return { __error: true, detail: String(e) };
      }
    };

    try {
      const endpoints = [`${API_BASE}/outfits/${id}`, `${API_BASE}/posts/${id}`];
      let updated = null;
      for (const ep of endpoints) {
        // outfits API 需要 name/description/tags；posts API 需要 title/content/tags
        const isOutfitEndpoint = ep.includes('/outfits/');
        const body = isOutfitEndpoint
          ? {
              name: editTitle || '',
              description: editDescription || '',
              tags: tagString,
            }
          : {
              title: editTitle || '',
              content: editDescription || '',
              tags: tagString,
            };
        // eslint-disable-next-line no-await-in-loop
        const res = await tryPut(ep, body);
        if (res && !res.__error) {
          updated = res;
          break;
        }
        // 若回傳錯誤物件，保留最後一個錯誤以供顯示
        if (res && res.__error) {
          updated = res;
        }
      }

      if (!updated) {
        toast?.addToast?.({ type: 'error', title: '更新失敗', message: '後端未回傳可用資料' });
      } else if (updated.__error) {
        // 顯示後端錯誤內容
        toast?.addToast?.({ type: 'error', title: `更新失敗 (${updated.status || ''})`, message: updated.detail || '未知錯誤' });
      } else {
        // 更新本地顯示
        const merged = { ...localOutfit, ...updated };
        setLocalOutfit(merged);
        // 關閉 modal 並通知父元件重新載入（確保資料從後端取回且不會消失）
        toast?.addToast?.({ type: 'success', title: '更新完成', message: '穿搭已更新' });
        onClose(true);
      }
    } finally {
      setDeleting(false);
    }
  };

  // 刪除：嘗試呼叫可能的 API endpoint（先 /outfits/{id} 再 /posts/{id}）
  // 開啟刪除確認
  const handleDelete = () => {
    setAskDelete(true);
  };

  // 確認刪除後執行的實際刪除動作
  const confirmDelete = async () => {
    setAskDelete(false);
    const id = outfit?.id || outfit?.post_id || outfit?._id;
    if (!id) {
      toast?.addToast?.({ type: 'error', title: '刪除失敗', message: '找不到要刪除的項目 id' });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast?.addToast?.({ type: 'warning', title: '未登入', message: '請先登入' });
      return;
    }

    setDeleting(true);
    const API_BASE = import.meta.env?.VITE_API_BASE || 'https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1';

    const tryDelete = async (url) => {
      try {
        const res = await fetch(url, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) return true;
        return false;
      } catch (e) {
        return false;
      }
    };

    try {
      const endpoints = [`${API_BASE}/outfits/${id}`, `${API_BASE}/posts/${id}`];
      let deleted = false;
      for (const ep of endpoints) {
        // eslint-disable-next-line no-await-in-loop
        const okResp = await tryDelete(ep);
        if (okResp) {
          deleted = true;
          break;
        }
      }

      if (!deleted) {
        toast?.addToast?.({ type: 'error', title: '刪除失敗', message: '後端回應錯誤或找不到資源' });
      } else {
        toast?.addToast?.({ type: 'success', title: '刪除成功', message: '該筆穿搭已刪除' });
        // 成功後通知父元件重新載入
        onClose(true);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-200 z-10 flex items-center justify-between shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {dateLabel} 穿搭
          </h2>
          <button
            onClick={() => onClose(false)}
            className="p-2 rounded-full hover:bg-slate-100 transition"
            aria-label="關閉"
          >
            <XMarkIcon className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {/* 原本的穿搭圖片區 */}
          {imageUrl ? (
            <div className="w-full aspect-[3/4] bg-slate-50 rounded-2xl mb-2 flex items-center justify-center overflow-hidden shadow border border-slate-100">
              <img
                src={imageUrl}
                alt={outfit?.name || "穿搭照片"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement.innerHTML =
                    `<span class="text-slate-400 text-sm">圖片載入失敗</span>`;
                }}
              />
            </div>
          ) : (
            // 無圖片時顯示較矮的占位框
            <div className="w-full bg-slate-50 rounded-2xl mb-2 flex items-center justify-center overflow-hidden shadow border border-slate-100 py-6">
              <div className="text-slate-400 text-sm text-center">
                <SparklesIcon className="w-8 h-6 mx-auto mb-2 text-slate-300" />
                尚未上傳該日穿搭
              </div>
            </div>
          )}
          
          {/* 文本資訊或編輯表單：只有在有圖片時顯示 */}
          {imageUrl && (
            <div className="space-y-3 text-sm">
              {isEditing ? (
                <div className="space-y-3">
                  <InfoCard title="穿搭標題" icon={<PencilSquareIcon className="w-4 h-4 text-indigo-500" />}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </InfoCard>

                  <InfoCard title="穿搭筆記" icon={<PencilSquareIcon className="w-4 h-4 text-cyan-500" />}>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={4}
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </InfoCard>

                  <InfoCard title="分類標籤" icon={<TagIcon className="w-4 h-4 text-pink-500" />}>
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="用空白或逗號分隔"
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">用空格或逗號分隔不同標籤</p>
                  </InfoCard>
                </div>
              ) : (
                <>
                  <InfoCard
                    title="穿搭標題"
                    icon={<PencilSquareIcon className="w-4 h-4 text-indigo-500" />}
                  >
                    <div className="text-base font-semibold text-slate-800">
                      {localOutfit?.name || outfit?.name || ""}
                    </div>
                  </InfoCard>

                  <InfoCard
                    title="穿搭筆記"
                    icon={<PencilSquareIcon className="w-4 h-4 text-cyan-500" />}
                  >
                    <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                      {localOutfit?.description || outfit?.description || "這個穿搭沒有留下任何備註。"}
                    </div>
                  </InfoCard>

                  <InfoCard
                    title="分類標籤"
                    icon={<TagIcon className="w-4 h-4 text-pink-500" />}
                  >
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(localOutfit?.tags || outfit?.tags || '').split(/[,\s]+/).filter(Boolean).length > 0 ? (
                        (localOutfit?.tags || outfit?.tags || '').split(/[,\s]+/).filter(Boolean).map((tag) => (
                          <span key={tag} className="px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-medium">#{tag}</span>
                        ))
                      ) : (
                        <span className="text-slate-400">尚未新增任何標籤</span>
                      )}
                    </div>
                  </InfoCard>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center gap-3 rounded-b-2xl">
          <div className="flex items-center gap-2">
            {/* 如果正在編輯，隱藏左側編輯/新增按鈕 */}
            {!isEditing && (
              <>
                {imageUrl && (
                  <>
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                    >
                      編輯
                    </button>
                    <button
                      onClick={handleGoNewOutfit}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                    >
                      新增穿搭
                    </button>
                  </>
                )}
                {!imageUrl && (
                  <button
                    onClick={handleGoNewOutfit}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                  >
                    新增穿搭
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  disabled={deleting}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 ${deleting ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {deleting ? '儲存中...' : '儲存'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm"
                >
                  取消
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onClose(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm"
                >
                  關閉視窗
                </button>
                {imageUrl && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm ${deleting ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {deleting ? '刪除中...' : '刪除'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* AskModal for delete confirmation */}
        <AskModal
          open={askDelete}
          title="確定要刪除這筆穿搭嗎？"
          message="刪除後無法復原，確定要刪除嗎？"
          confirmText="確定刪除"
          cancelText="取消"
          destructive
          onConfirm={confirmDelete}
          onCancel={() => setAskDelete(false)}
        />
      </div>
    </div>
  );
}

function InfoCard({ title, children, icon }) {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition">
      <div className="flex items-center mb-2">
        {icon}
        <div className="ml-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

InfoCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  icon: PropTypes.node,
};

OutfitModal.propTypes = {
  date: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
  outfit: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onUploadUserImage: PropTypes.func,
};
