// src/pages/UserProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import PostCard from "../components/PostCard";
import { useToast } from "../components/ToastProvider";

const API_BASE = import.meta.env.VITE_API_BASE || "https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1";

function resolveGcsUrl(gsOrHttp) {
  if (!gsOrHttp) return null;
  if (gsOrHttp.startsWith("http://") || gsOrHttp.startsWith("https://")) return gsOrHttp;
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

export default function UserProfile({ theme, setTheme }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState({
    displayName: "載入中...",
    bio: "",
    picture: null,
  });
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/posts/user/${id}`);
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `讀取使用者貼文失敗 (${res.status})`);
        }
        const data = await res.json();
        if (cancelled) return;

        const arr = Array.isArray(data) ? data : [];
        setPosts(arr);

        if (arr.length > 0) {
          const first = arr[0];
          const displayName = first.display_name || first.author || "用戶";
          const bio = first.interformation || "";
          const pictureRaw = first.avatar_url || first.picture || null;
          const picture = resolveGcsUrl(pictureRaw);
          setUser({ displayName, bio, picture });
        } else {
          setUser({
            displayName: "這位使用者尚未發佈貼文",
            bio: "",
            picture: null,
          });
        }
      } catch (err) {
        console.error("讀取使用者資訊失敗", err);
        if (!cancelled) {
          setError(err.message || "讀取使用者資訊失敗");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/home");
    }
  };

  return (
    <Layout theme={theme} setTheme={setTheme}>
      <div className="page-wrapper h-full overflow-y-auto py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <button
            type="button"
            onClick={handleBack}
            className="mb-6 flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            返回
          </button>

          {loading ? (
            <div className="text-center text-gray-500">載入中...</div>
          ) : error ? (
            <div className="text-center text-red-600 font-medium">{error}</div>
          ) : (
            <>
              {/* 頭像與簡介 */}
              <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col sm:flex-row items-center gap-6 mb-8">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                  {user.picture ? (
                    <img src={user.picture} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-semibold text-gray-500">
                      {user.displayName?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{user.displayName}</h1>
                  {user.bio && <p className="text-gray-600 text-sm">{user.bio}</p>}
                </div>
              </div>

              {/* 貼文列表 */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">公開貼文</h2>
                {posts.length === 0 ? (
                  <div className="text-center text-gray-500 bg-white rounded-xl py-6 shadow-sm">
                    目前沒有公開貼文
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {posts.map((p) => {
                      let mediaArr = [];
                      try {
                        mediaArr = Array.isArray(p.media) ? p.media : JSON.parse(p.media || "[]");
                      } catch {
                        mediaArr = [];
                      }
                      const cover = pickCoverUrl(mediaArr) || "/default-outfit.png";
                      return (
                        <PostCard
                          key={p.id}
                          imageUrl={cover}
                          alt={p.title || "貼文"}
                          likes={p.like_count ?? 0}
                          onClick={() => {
                            navigate(`/posts/${p.id}`);
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
