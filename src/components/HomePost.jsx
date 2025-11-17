// src/components/HomePost.jsx
import React, { useEffect, useState } from "react";
import PostCard from "./PostCard";
import PostDetailModal from "./PostDetailModal";

// ✅ 後端 API 基底網址（僅用來抓公開貼文清單）
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1";

/** 將 gs:// 轉為公開可瀏覽的網址（不走簽名） */
function resolveGcsUrl(gsOrHttp) {
  if (!gsOrHttp) return null;
  if (gsOrHttp.startsWith("http://") || gsOrHttp.startsWith("https://"))
    return gsOrHttp;
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

/** 從 media 陣列找封面圖（公開優先、完全不簽名） */
function pickCoverUrl(media) {
  if (!Array.isArray(media) || media.length === 0) return null;
  const cover = media.find((m) => m?.is_cover) || media[0];
  if (!cover) return null;

  // 優先：直接可公開取用的欄位
  const raw =
    cover?._view ||
    cover?.url ||
    cover?.image_url ||
    cover?.image ||
    cover?.authenticated_url || // 若後端曾塞過可直接取用的 URL
    cover?.gcs_uri ||
    cover?.gcsUrl ||
    null;

  return resolveGcsUrl(raw);
}

/** 僅將 media 陣列的每個項目補上 _view（公開 URL），不簽名 */
function normalizeMediaArray(mediaArr) {
  const out = [];
  for (const m of mediaArr || []) {
    // 先用已存在的明確 URL
    const direct = m?.url || m?.image_url || m?.image || m?.authenticated_url;
    if (direct) {
      out.push({ ...m, _view: direct });
      continue;
    }
    // 再嘗試從 gcs_uri 轉公開網址
    const gcs = m?.gcs_uri || m?.gcsUrl || null;
    if (gcs) {
      out.push({ ...m, _view: resolveGcsUrl(gcs) });
      continue;
    }
    out.push(m);
  }
  return out;
}

export default function HomePost() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    // 從 sessionStorage 恢復搜尋狀態（公開模式）
    const restoreSearchState = () => {
      try {
        const savedQuery = sessionStorage.getItem("homepost_search_query");
        const savedResults = sessionStorage.getItem("homepost_search_results");
        if (savedQuery && savedResults) {
          setSearchQuery(savedQuery);

          const results = JSON.parse(savedResults);
          const hydrated = [];
          for (const post of results) {
            let mediaArr = [];
            try {
              if (Array.isArray(post.media)) mediaArr = post.media;
              else if (typeof post.media === "string")
                mediaArr = JSON.parse(post.media || "[]");
            } catch (e) {
              console.error(`解析貼文 ${post.id} 的 media 失敗:`, e);
            }
            hydrated.push({
              ...post,
              _mediaArr: normalizeMediaArray(mediaArr),
            });
          }
          setPosts(hydrated);
          setLoading(false);
          return true;
        }
      } catch (e) {
        console.error("恢復搜尋狀態失敗:", e);
      }
      return false;
    };

    // 抓公開貼文（完全公開圖片，不簽名）
    const fetchPublicPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/posts/?visibility=public&limit=50`,
          {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          console.warn(`讀取公開貼文失敗 (${res.status})`);
          setPosts([]);
          return;
        }

        const data = await res.json();

        // 正規化 media
        const hydrated = (data || []).map((it) => {
          let mediaArr = [];
          try {
            mediaArr = Array.isArray(it.media)
              ? it.media
              : JSON.parse(it.media || "[]");
          } catch {
            mediaArr = [];
          }
          return { ...it, _mediaArr: normalizeMediaArray(mediaArr) };
        });

        setPosts(hydrated);
      } catch (e) {
        if (e?.name !== "AbortError") {
          console.warn("讀取公開貼文錯誤：", e);
          setError("讀取貼文失敗");
        }
      } finally {
        setLoading(false);
      }
    };

    // 監聽搜尋事件（外部觸發，結果直接用公開 URL 呈現）
    const handleSearchPosts = (event) => {
      const { query, results, loading: searchLoading, error: searchError } =
        event.detail;

      setSearchQuery(query || "");

      if (searchLoading) {
        setLoading(true);
        setError(null);
        return;
      }
      if (searchError) {
        setError(searchError);
        setLoading(false);
        return;
      }

      if (results) {
        // 存搜尋狀態
        try {
          sessionStorage.setItem("homepost_search_query", query);
          sessionStorage.setItem(
            "homepost_search_results",
            JSON.stringify(results)
          );
        } catch (e) {
          console.error("儲存搜尋狀態失敗:", e);
        }

        const hydrated = [];
        for (const post of results) {
          let mediaArr = [];
          try {
            if (Array.isArray(post.media)) mediaArr = post.media;
            else if (typeof post.media === "string")
              mediaArr = JSON.parse(post.media || "[]");
          } catch (e) {
            console.error(`解析貼文 ${post.id} 的 media 失敗:`, e, post.media);
          }
          hydrated.push({
            ...post,
            _mediaArr: normalizeMediaArray(mediaArr),
          });
        }

        setPosts(hydrated);
        setLoading(false);
      } else if (query === "") {
        // 清空搜尋 → 重載公開貼文
        try {
          sessionStorage.removeItem("homepost_search_query");
          sessionStorage.removeItem("homepost_search_results");
        } catch (e) {
          console.error("清除搜尋狀態失敗:", e);
        }
        fetchPublicPosts();
      }
    };

    // 初次載入：若無保存的搜尋狀態，就抓公開貼文
    const restored = restoreSearchState();
    if (!restored) fetchPublicPosts();

    // 新增/刪除貼文後，若非搜尋狀態，重新抓
    const handlePostCreated = () => {
      if (!searchQuery) fetchPublicPosts();
    };
    const handlePostDeleted = () => {
      if (!searchQuery) fetchPublicPosts();
    };

    window.addEventListener("post-created", handlePostCreated);
    window.addEventListener("post-deleted", handlePostDeleted);
    window.addEventListener("search-posts", handleSearchPosts);

    return () => {
      controller.abort();
      window.removeEventListener("post-created", handlePostCreated);
      window.removeEventListener("post-deleted", handlePostDeleted);
      window.removeEventListener("search-posts", handleSearchPosts);
    };
  }, []);

  if (loading) {
    return (
      <div className="text-center text-slate-500 py-8">
        {searchQuery ? `搜尋「${searchQuery}」中...` : "載入貼文中..."}
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 py-8">{error}</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8">
        {searchQuery
          ? `找不到與「${searchQuery}」相關的貼文`
          : "目前沒有公開貼文"}
      </div>
    );
  }

  return (
    <>
      {searchQuery && (
        <div className="mb-4 text-sm text-slate-600">
          搜尋「<span className="font-semibold">{searchQuery}</span>」的結果：共{" "}
          {posts.length} 篇貼文
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map((post) => {
          const coverUrl = pickCoverUrl(post._mediaArr);
          if (!coverUrl) {
            console.warn(`⚠️ 貼文 ${post.id} 無封面圖:`, {
              mediaArr: post._mediaArr,
              media: post.media,
              title: post.title,
            });
          }
          return (
            <PostCard
              key={post.id}
              imageUrl={coverUrl}
              alt={post.title || "貼文"}
              likes={post.like_count ?? 0}
              onClick={() => setSelectedPostId(post.id)}
              useSigned={false}   // ✅ 公開模式：不打 /signed-url，速度更快
            />
          );
        })}
      </div>

      {selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
        />
      )}
    </>
  );
}
