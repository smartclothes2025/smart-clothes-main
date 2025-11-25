// src/pages/UserProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import PostCard from "../components/PostCard";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1";

/** 將 gs:// 轉成可瀏覽網址，若已經是 http(s) 就直接回傳 */
function resolveGcsUrl(gsOrHttp) {
  if (!gsOrHttp) return null;
  if (gsOrHttp.startsWith("http://") || gsOrHttp.startsWith("https://")) {
    return gsOrHttp;
  }
  if (gsOrHttp.startsWith("gs://")) {
    const without = gsOrHttp.replace("gs://", "");
    const slash = without.indexOf("/");
    if (slash > 0) {
      const bucket = without.slice(0, slash);
      const object = encodeURI(without.slice(slash + 1));
      return `https://storage.googleapis.com/${bucket}/${object}`;
    }
  }
  return gsOrHttp;
}

/** 統一處理頭貼網址（gs:// / 一般 URL） */
function normalizeAvatarUrl(raw) {
  if (!raw) return null;

  if (typeof raw === "string" && raw.startsWith("gs://")) {
    return resolveGcsUrl(raw);
  }

  if (
    typeof raw === "string" &&
    (raw.startsWith("http://") || raw.startsWith("https://"))
  ) {
    return raw;
  }

  return resolveGcsUrl(raw);
}

/** 從 media 陣列挑出封面圖 */
function pickCoverUrl(media) {
  if (!Array.isArray(media) || media.length === 0) return null;
  const cover = media.find((m) => m?.is_cover) || media[0];

  const raw =
    cover?._view ||
    cover?.authenticated_url ||
    cover?.url ||
    cover?.image_url ||
    cover?.image ||
    cover?.gcs_uri ||
    cover?.gcsUrl ||
    null;

  return resolveGcsUrl(raw);
}

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState({
    displayName: "",
    bio: "",
    picture: null,
  });
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        // 一次讀貼文 + app_users（含 picture）
        const [postRes, usersRes] = await Promise.all([
          fetch(`${API_BASE}/posts/user/${id}`),
          fetch(`${API_BASE}/users?limit=200`),
        ]);

        if (!postRes.ok) {
          throw new Error(`讀取使用者貼文失敗 (${postRes.status})`);
        }
        if (!usersRes.ok) {
          throw new Error(`讀取使用者清單失敗 (${usersRes.status})`);
        }

        const postData = await postRes.json();
        const usersData = await usersRes.json();

        if (cancelled) return;

        const arr = Array.isArray(postData) ? postData : [];
        setPosts(arr);

        // 先從貼文裡抓暱稱 / 自介
        let displayName = "";
        let bio = "";
        if (arr.length > 0) {
          const first = arr[0];
          displayName = first.display_name || first.author || "";
          bio = first.interformation || "";
        }

        // 再從 app_users 找到對應 user（有 picture）
        const userList = Array.isArray(usersData) ? usersData : [];
        const targetUser = userList.find(
          (u) => String(u.id) === String(id)
        );

        let picture = null;

        if (targetUser) {
          if (!displayName) {
            displayName =
              targetUser.display_name ||
              targetUser.name ||
              targetUser.email ||
              "";
          }
          if (!bio) {
            bio = targetUser.interformation || "";
          }

          const rawPicture = targetUser.picture || null;
          picture = normalizeAvatarUrl(rawPicture);
        }

        setUser({
          displayName: displayName || "用戶",
          bio,
          picture,
        });
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e.message || "讀取使用者資訊失敗");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const avatarChar =
    user.displayName?.trim().charAt(0)?.toUpperCase() || "用戶";

  return (
    <Layout title="用戶貼文">
      <div className="page-wrapper">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 上方列：返回鍵 + 路徑 */}
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span>返回</span>
              </button>
              <span className="text-slate-300">/</span>
              <span className="truncate max-w-[180px]">
                {user.displayName || "用戶"}
              </span>
            </div>
          </div>

          {/* 使用者卡片 */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
            <div className="h-1 bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-pink-400" />
            <div className="p-6 sm:p-7 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* 頭貼 */}
              <div className="w-24 h-24 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-semibold text-slate-500">
                    {avatarChar}
                  </span>
                )}
              </div>

              {/* 名稱＋自我介紹 */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-slate-800">
                  {user.displayName}
                </h1>
                {user.bio ? (
                  <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
                    {user.bio}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">
                    尚未填寫個人簡介。
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 公開貼文區塊 */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-slate-800">
                公開貼文
              </h2>
              {!loading && !error && (
                <span className="text-xs text-slate-400">
                  共 {posts.length} 則
                </span>
              )}
            </div>
            <div className="h-px bg-slate-200 mb-4" />

            {loading ? (
              <div className="text-center text-slate-500 py-8">
                載入中...
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">{error}</div>
            ) : posts.length === 0 ? (
              <div className="text-center text-slate-500 bg-white rounded-xl py-8 shadow-sm">
                目前沒有公開貼文
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {posts.map((p) => {
                  let mediaArr = [];
                  try {
                    mediaArr = Array.isArray(p.media)
                      ? p.media
                      : JSON.parse(p.media || "[]");
                  } catch {
                    mediaArr = [];
                  }
                  const cover =
                    pickCoverUrl(mediaArr) || "/default-outfit.png";

                  return (
                    <PostCard
                      key={p.id}
                      imageUrl={cover}
                      alt={p.title || "貼文"}
                      likes={p.like_count ?? 0}
                      onClick={() => navigate(`/posts/${p.id}`)}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}
