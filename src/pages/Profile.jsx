// src/pages/Profile.jsx
import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import { Cog6ToothIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import PostCard from "../components/PostCard";
import StyledButton from "../components/ui/StyledButton";
import EditProfileModal from "./EditProfileModal";
import PostDetailModal from "../components/PostDetailModal";
import { useToast } from "../components/ToastProvider";

// ✅ 後端 API 基底網址（從 .env 讀，沒讀到就用本機）
const API_BASE = import.meta.env.VITE_API_BASE || "https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1";

/** 將 gs:// 轉為可瀏覽的網址（若已是 http/https 直接回傳） */
function resolveGcsUrl(gsOrHttp) {
  if (!gsOrHttp) return null;
  if (gsOrHttp.startsWith("http://") || gsOrHttp.startsWith("https://")) return gsOrHttp;
  if (gsOrHttp.startsWith("gs://")) {
    const without = gsOrHttp.replace("gs://", "");
    const slash = without.indexOf("/");
    if (slash > 0) {
      const bucket = without.slice(0, slash);
      const object = encodeURI(without.slice(slash + 1));
      // ✅ 改成公開可讀的連結（注意是 storage.googleapis.com，不是 cloud.google.com）
      return `https://storage.googleapis.com/${bucket}/${object}`;
    }
  }
  return gsOrHttp;
}

/** 從 media 陣列找封面圖（優先 is_cover；支援多種欄位名稱） */
function pickCoverUrl(media) {
  if (!Array.isArray(media) || media.length === 0) return null;
  const cover = media.find((m) => m?.is_cover) || media[0];

  const raw =
    cover?._view ||          // ← 先吃我們補好的 _view
    cover?.authenticated_url ||   // 後端若直接給簽名網址
    cover?.url ||                 // 一些後端會叫 url
    cover?.image_url ||           // 有些叫 image_url
    cover?.image ||               // 你截圖裡可見的 image
    cover?.gcs_uri ||             // 你截圖也看到 gcs_uri
    cover?.gcsUrl || null;

  return resolveGcsUrl(raw);
}

async function resolveMediaArray(mediaArr, token) {
  // 把每一個 media 物件補一個 _view 欄位：可直接給 <img> 用的 URL
  const trySign = async (gcsUri) => {
    // 這個路徑視你的後端而定：如果後端提供不同名稱，改掉即可
    const url = `${API_BASE}/media/signed-url?gcs_uri=${encodeURIComponent(gcsUri)}`;
    try {
      const r = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (r.ok) {
        const j = await r.json().catch(() => ({}));
        return j.authenticated_url || j.url || null;
      }
    } catch {}
    return null;
  };

  const out = [];
  for (const m of mediaArr || []) {
    const direct =
      m?.authenticated_url ||
      m?.url ||
      m?.image_url;

    if (direct) {
      out.push({ ...m, _view: direct });
      continue;
    }

    const gcs = m?.gcs_uri || m?.image || null;
    if (!gcs) {
      out.push(m);
      continue;
    }

    // 先嘗試向後端換簽名網址
    let signed = await trySign(gcs);
    if (!signed) {
      // 沒有簽名網址就退回 cloud console（只有公開桶才會顯示）
      signed = resolveGcsUrl(gcs);
    }
    out.push({ ...m, _view: signed });
  }
  return out;
}

const StatItem = ({ count, label }) => (
  <div className="text-center">
    <div className="font-bold text-xl text-slate-700">{count}</div>
    <div className="text-sm text-slate-500">{label}</div>
  </div>
);

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 relative ${
      active ? "text-indigo-600" : "text-slate-500 hover:text-indigo-500"
    }`}
  >
    {label}
    {active && (
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-indigo-500 rounded-full" />
    )}
  </button>
);

const MeasurementItem = ({ label, value, unit }) => {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="bg-slate-100 p-3 rounded-lg text-center">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold text-slate-800">
        {value} <span className="text-sm text-slate-400">{unit}</span>
      </div>
    </div>
  );
};

export default function Profile() {
  const toast = useToast();

  const [tab, setTab] = useState("posts");
  const [user, setUser] = useState({
    displayName: "載入中...",
    bio: "",
    height: null,
    weight: null,
    bust: null,
    waist: null,
    hip: null,
    shoulder: null,
    picture: null,
    sex: null,
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  // ✅ 我的貼文列表（hooks 一律放在元件裡）
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // ✅ 收藏貼文與追蹤/粉絲列表
  const [favoritePosts, setFavoritePosts] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loadingFollows, setLoadingFollows] = useState(false);

  const [metricsOpen, setMetricsOpen] = useState(() => {
    try {
      const v = localStorage.getItem("profile_metrics_open");
      if (v === "0") return false;
      if (v === "1") return true;
    } catch {}
    return true;
  });

  const fileInputRef = useRef(null);

  // 讀取 ?edit=1 直接開啟編輯
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const edit = params.get("edit");
      if (edit === "1" || edit === "true") setIsModalOpen(true);
    } catch {}
  }, []);

  // 讀使用者資料（auth + body_metrics）
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        const [r1, r2] = await Promise.all([
          fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            signal: controller.signal,
          }),
          fetch(`${API_BASE}/me/body_metrics`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            signal: controller.signal,
          }),
        ]);

        let authData = {};
        if (r1.ok) authData = (await r1.json().catch(() => ({}))) || {};
        let metrics = {};
        if (r2.ok) metrics = (await r2.json().catch(() => ({}))) || {};

        const displayName = authData.display_name || metrics.display_name || authData.name || "用戶";
        const bio = authData.interformation || "";

        const pictureRaw =
          authData.picture ||
          metrics.picture ||
          (() => {
            try {
              return JSON.parse(localStorage.getItem("user") || "{}").picture || null;
            } catch {
              return null;
            }
          })();

        // ✅ Bucket 已設為公開，處理圖片 URL
        let picture = null;
        if (pictureRaw) {
          // 如果是簽名 URL（包含 X-Goog-Signature），去掉簽名參數
          if (pictureRaw.includes('X-Goog-Signature')) {
            // 取得 ? 之前的乾淨 URL
            picture = pictureRaw.split('?')[0];
          } else if (pictureRaw.startsWith('gs://')) {
            // 如果是 gs:// URI，轉換為公開 URL
            picture = resolveGcsUrl(pictureRaw);
          } else {
            // 已經是乾淨的 HTTP(S) URL
            picture = pictureRaw;
          }
        }

        setUser({
          displayName,
          bio,
          height: metrics.height_cm ?? null,
          weight: metrics.weight_kg ?? null,
          bust: metrics.chest_cm ?? null,
          waist: metrics.waist_cm ?? null,
          hip: metrics.hip_cm ?? null,
          shoulder: metrics.shoulder_cm ?? null,
          picture,
          sex: metrics.sex ?? authData.sex ?? null,
        });
      } catch (err) {
        if (err?.name !== "AbortError") console.warn("取得使用者資料失敗：", err);
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, []);

// 讀自己的貼文清單
useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) return;
  const controller = new AbortController();

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      // 尾斜線避免 307
      const res = await fetch(`${API_BASE}/posts/?scope=mine&limit=30`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal: controller.signal,
      });
      if (res.status === 401) {
        console.warn("未授權，請先登入或 token 失效");
        setPosts([]);
        return;
      }
      if (!res.ok) throw new Error(`讀取貼文失敗 (${res.status})`);

      const data = await res.json();

      // 先把 media 變成陣列
      const prelim = (data || []).map((it) => {
        let mediaArr = [];
        try {
          mediaArr = Array.isArray(it.media) ? it.media : JSON.parse(it.media || "[]");
        } catch {
          mediaArr = [];
        }
        return { ...it, _mediaArr: mediaArr };
      });

      // 逐篇把 gs:// 解析成可看的 _view
      const hydrated = [];
      for (const it of prelim) {
        const resolved = await resolveMediaArray(it._mediaArr, token);
        hydrated.push({ ...it, _mediaArr: resolved });
      }

      setPosts(hydrated);
    } catch (e) {
      // React 18 開發模式 StrictMode 會二次執行 effect，第一次 cleanup 會 abort
      if (e?.name !== "AbortError") console.warn(e);
    } finally {
      setLoadingPosts(false);
    }
  };

  fetchPosts();
  const handlePostCreated = () => fetchPosts();
  const handlePostDeleted = () => fetchPosts();
  window.addEventListener("post-created", handlePostCreated);
  window.addEventListener("post-deleted", handlePostDeleted);
  return () => {
    controller.abort();
    window.removeEventListener("post-created", handlePostCreated);
    window.removeEventListener("post-deleted", handlePostDeleted);
  };
}, []);

  // 讀取收藏貼文與追蹤/粉絲列表
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const controller = new AbortController();

    const fetchExtra = async () => {
      setLoadingFavorites(true);
      setLoadingFollows(true);
      try {
        const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

        const [favRes, followingRes, followersRes] = await Promise.allSettled([
          fetch(`${API_BASE}/posts/favorites/me?limit=50`, { headers, signal: controller.signal }),
          fetch(`${API_BASE}/me/following`, { headers, signal: controller.signal }),
          fetch(`${API_BASE}/me/followers`, { headers, signal: controller.signal }),
        ]);

        // 收藏貼文
        if (favRes.status === "fulfilled" && favRes.value.ok) {
          const data = await favRes.value.json();
          const prelim = (data || []).map((it) => {
            let mediaArr = [];
            try {
              mediaArr = Array.isArray(it.media) ? it.media : JSON.parse(it.media || "[]");
            } catch {
              mediaArr = [];
            }
            return { ...it, _mediaArr: mediaArr };
          });

          const hydrated = [];
          for (const it of prelim) {
            const resolved = await resolveMediaArray(it._mediaArr, token);
            hydrated.push({ ...it, _mediaArr: resolved });
          }
          setFavoritePosts(hydrated);
        } else {
          setFavoritePosts([]);
        }

        // 追蹤中
        if (followingRes.status === "fulfilled" && followingRes.value.ok) {
          const data = await followingRes.value.json();
          setFollowingUsers(Array.isArray(data) ? data : []);
        } else {
          setFollowingUsers([]);
        }

        // 粉絲
        if (followersRes.status === "fulfilled" && followersRes.value.ok) {
          const data = await followersRes.value.json();
          setFollowers(Array.isArray(data) ? data : []);
        } else {
          setFollowers([]);
        }
      } catch (e) {
        if (e?.name !== "AbortError") console.warn("載入收藏/追蹤資料失敗", e);
        setFavoritePosts([]);
        setFollowingUsers([]);
        setFollowers([]);
      } finally {
        setLoadingFavorites(false);
        setLoadingFollows(false);
      }
    };

    fetchExtra();
    return () => controller.abort();
  }, []);

  // 儲存個資
  const handleSaveProfile = async (updatedData) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("請先登入");
      return;
    }

    const payload = {
      display_name: updatedData.displayName || null,
      height_cm: updatedData.height ? Number(updatedData.height) : null,
      weight_kg: updatedData.weight ? Number(updatedData.weight) : null,
      chest_cm: updatedData.bust ? Number(updatedData.bust) : null,
      waist_cm: updatedData.waist ? Number(updatedData.waist) : null,
      hip_cm: updatedData.hip ? Number(updatedData.hip) : null,
      shoulder_cm: updatedData.shoulder ? Number(updatedData.shoulder) : null,
      interformation: updatedData.bio ?? null,
      sex: updatedData.sex ?? null,
    };

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/me/body_metrics`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errObj = await res.json().catch(() => null);
        throw new Error(errObj?.detail || `儲存失敗 (status ${res.status})`);
      }

      const saved = await res.json();

      setUser((prev) => ({
        ...prev,
        displayName: saved.display_name || updatedData.displayName,
        bio: updatedData.bio ?? "",
        height: saved.height_cm ?? updatedData.height,
        weight: saved.weight_kg ?? updatedData.weight,
        bust: saved.chest_cm ?? updatedData.bust,
        waist: saved.waist_cm ?? updatedData.waist,
        hip: saved.hip_cm ?? updatedData.hip,
        shoulder: saved.shoulder_cm ?? updatedData.shoulder,
        sex: saved.sex ?? updatedData.sex ?? prev.sex,
      }));

      localStorage.setItem(
        "user",
        JSON.stringify({
          display_name: saved.display_name || updatedData.displayName,
          bio: updatedData.bio ?? "",
          height: saved.height_cm ?? updatedData.height,
          weight: saved.weight_kg ?? updatedData.weight,
          chest: saved.chest_cm ?? updatedData.bust,
          waist: saved.waist_cm ?? updatedData.waist,
          hip: saved.hip_cm ?? updatedData.hip,
          shoulder: saved.shoulder_cm ?? updatedData.shoulder,
          sex: saved.sex ?? updatedData.sex ?? undefined,
        })
      );

      setIsModalOpen(false);
      toast.addToast && toast.addToast({ type: "success", title: "個人資料修改成功" });
      window.dispatchEvent(new CustomEvent("user-profile-updated", { detail: saved }));
    } catch (err) {
      console.error("儲存個人檔案失敗:", err);
      alert(`儲存失敗: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const avatarChar = user.displayName?.charAt(0)?.toUpperCase() || "?";

  return (
    <Layout title="個人檔案">
      <div className="page-wrapper" aria-busy={loading}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white p-6 rounded-2xl shadow-md w-full">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="w-full h-full flex items-center justify-center focus:outline-none"
                  title="上傳頭貼"
                >
                  {user.picture ? (
                    <img src={user.picture} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-semibold text-slate-500">{avatarChar}</span>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files && e.target.files[0];
                    if (!f) return;
                    const token = localStorage.getItem("token");
                    if (!token) {
                      toast.addToast && toast.addToast({ 
                        type: "warning", 
                        title: "請先登入",
                        message: "需要登入才能上傳頭貼"
                      });
                      return;
                    }
                    setUploading(true);
                    try {
                      const fd = new FormData();
                      fd.append("file", f);
                      const resp = await fetch(`${API_BASE}/me/picture`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: fd,
                      });
                      if (!resp.ok) {
                        const err = await resp.json().catch(() => null);
                        throw new Error(err?.detail || `上傳失敗 (status ${resp.status})`);
                      }
                      const uploaded = await resp.json();

                      const rawUrl = uploaded.gcs_uri || uploaded.image_url || uploaded.authenticated_url || null;
                      const imageUrl = resolveGcsUrl(rawUrl);
                      
                      const bustUrl = imageUrl
                        ? `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}v=${Date.now()}`
                        : null;

                      if (bustUrl) {
                        setUser((prev) => ({ ...prev, picture: bustUrl }));
                        try {
                          const localUser = JSON.parse(localStorage.getItem("user") || "{}");
                          localStorage.setItem("user", JSON.stringify({ ...localUser, picture: bustUrl }));
                        } catch {}
                        window.dispatchEvent(
                          new CustomEvent("user-profile-updated", { detail: { picture: bustUrl } })
                        );
                        
                        // 顯示成功通知
                        toast.addToast && toast.addToast({ 
                          type: "success", 
                          title: "頭貼上傳成功",
                          message: "個人頭像已更新",
                          autoDismiss: 2000
                        });
                      }
                    } catch (err) {
                      console.error("上傳頭貼失敗", err);
                      toast.addToast && toast.addToast({ 
                        type: "error", 
                        title: "上傳失敗",
                        message: err?.message || "上傳頭貼失敗，請稍後再試",
                        autoDismiss: 4000
                      });
                    } finally {
                      setUploading(false);
                      e.target.value = "";
                    }
                  }}
                />
                {uploading && (
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center text-white text-sm">
                    上傳中...
                  </div>
                )}
              </div>

              <div className="flex-grow w-full text-center sm:text-left">
                <h1 className="text-2xl font-bold text-slate-800">{user.displayName}</h1>
                <p className="text-slate-500 mt-1 text-sm">{user.bio}</p>
                <div className="mt-4 flex justify-center sm:justify-start items-center gap-4">
                  <StyledButton onClick={() => setIsModalOpen(true)}>
                    <PencilSquareIcon className="w-4 h-4" />
                    編輯檔案
                  </StyledButton>
                  <Link to="/settings">
                    <StyledButton variant="secondary">
                      <Cog6ToothIcon className="w-4 h-4" />
                      設定
                    </StyledButton>
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-600 mb-3">穿搭資訊</h3>
                <button
                  type="button"
                  onClick={() => {
                    setMetricsOpen((s) => {
                      const next = !s;
                      try {
                        localStorage.setItem("profile_metrics_open", next ? "1" : "0");
                      } catch {}
                      return next;
                    });
                  }}
                  aria-expanded={metricsOpen}
                  aria-controls="body-metrics"
                  className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1 rounded-md"
                >
                  {metricsOpen ? (
                    <span className="flex items-center gap-2">
                      收合
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      展開
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M14.77 12.79a.75.75 0 01-1.06-.02L10 9.06 6.29 12.77a.75.75 0 11-1.06-1.06l4.24-4.24a.75.75 0 011.06 0l4.24 4.24a.75.75 0 01-.02 1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              </div>

              <div id="body-metrics" className={`${metricsOpen ? "block" : "hidden"}`}>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <MeasurementItem label="身高" value={user.height} unit="cm" />
                  <MeasurementItem label="體重" value={user.weight} unit="kg" />
                  <MeasurementItem label="胸圍" value={user.bust} unit="cm" />
                  <MeasurementItem label="腰圍" value={user.waist} unit="cm" />
                  <MeasurementItem label="臀圍" value={user.hip} unit="cm" />
                  <MeasurementItem label="肩寬" value={user.shoulder} unit="cm" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-center border-b border-slate-200">
              <TabButton label="貼文" active={tab === "posts"} onClick={() => setTab("posts")} />
              <TabButton label="收藏" active={tab === "collections"} onClick={() => setTab("collections")} />
              <TabButton label="粉絲" active={tab === "followers"} onClick={() => setTab("followers")} />
            </div>
            <div className="py-6">
              {tab === "posts" && (
                <>
                  {loadingPosts ? (
                    <div className="text-center text-slate-500">載入貼文中...</div>
                  ) : posts.length === 0 ? (
                    <div className="text-center text-slate-500">尚未發佈任何貼文</div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {posts.map((p) => {
                        const url = pickCoverUrl(p._mediaArr) || "/default-outfit.png";
                        return (
                          <PostCard
                            key={p.id}
                            imageUrl={url}
                            alt={p.title || "貼文"}
                            likes={p.like_count ?? 0}
                            onClick={() => setSelectedPostId(p.id)}
                          />
                        );
                      })}

                    </div>
                  )}
                </>
              )}

              {tab === "collections" && (
                <>
                  {loadingFavorites ? (
                    <div className="text-center text-slate-500">載入收藏中...</div>
                  ) : favoritePosts.length === 0 ? (
                    <div className="text-center text-slate-500">尚未收藏任何貼文</div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {favoritePosts.map((p) => {
                        const url = pickCoverUrl(p._mediaArr) || "/default-outfit.png";
                        return (
                          <PostCard
                            key={p.id}
                            imageUrl={url}
                            alt={p.title || "貼文"}
                            likes={p.like_count ?? 0}
                            onClick={() => setSelectedPostId(p.id)}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {tab === "followers" && (
                <div className="space-y-8">
                  {loadingFollows ? (
                    <div className="text-center text-slate-500">載入追蹤與粉絲中...</div>
                  ) : (
                    <>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-600 mb-3">追蹤中</h3>
                        {followingUsers.length === 0 ? (
                          <div className="text-center text-slate-500 text-sm bg-white rounded-xl py-4 shadow-sm">
                            目前尚未追蹤任何人
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {followingUsers.map((u) => (
                              <div
                                key={u.id}
                                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-100"
                              >
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {u.picture ? (
                                    <img
                                      src={resolveGcsUrl(u.picture)}
                                      alt={u.display_name || "使用者"}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-sm font-semibold text-slate-600">
                                      {(u.display_name || u.email || "?").charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-slate-800 truncate">
                                    {u.display_name || u.email || "使用者"}
                                  </div>
                                  {u.interformation && (
                                    <div className="text-xs text-slate-500 truncate">{u.interformation}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-slate-600 mb-3">粉絲</h3>
                        {followers.length === 0 ? (
                          <div className="text-center text-slate-500 text-sm bg-white rounded-xl py-4 shadow-sm">
                            目前還沒有粉絲
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {followers.map((u) => (
                              <div
                                key={u.id}
                                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-100"
                              >
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {u.picture ? (
                                    <img
                                      src={resolveGcsUrl(u.picture)}
                                      alt={u.display_name || "使用者"}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-sm font-semibold text-slate-600">
                                      {(u.display_name || u.email || "?").charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-slate-800 truncate">
                                    {u.display_name || u.email || "使用者"}
                                  </div>
                                  {u.interformation && (
                                    <div className="text-xs text-slate-500 truncate">{u.interformation}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <EditProfileModal user={user} onClose={() => setIsModalOpen(false)} onSave={handleSaveProfile} />
      )}
      
      {selectedPostId && (
        <PostDetailModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} />
      )}
    </Layout>
  );
}

StatItem.propTypes = { count: PropTypes.number, label: PropTypes.string };
TabButton.propTypes = { label: PropTypes.string.isRequired, active: PropTypes.bool, onClick: PropTypes.func };
MeasurementItem.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.any, unit: PropTypes.string };
