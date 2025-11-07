// src/components/HomePost.jsx
import React, { useEffect, useState } from "react";
import PostCard from "./PostCard";

// ✅ 後端 API 基底網址
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

/** 將 gs:// 轉為可瀏覽的網址 */
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

/** 從 media 陣列找封面圖 */
function pickCoverUrl(media) {
  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }
  
  const cover = media.find((m) => m?.is_cover) || media[0];
  
  if (!cover) {
    return null;
  }

  // 優先順序：_view > url > authenticated_url > image_url > gcs_uri
  const raw =
    cover?._view ||
    cover?.url ||
    cover?.authenticated_url ||
    cover?.image_url ||
    cover?.image ||
    cover?.gcs_uri ||
    cover?.gcsUrl || null;

  return resolveGcsUrl(raw);
}

/** 解析 media 陣列，補上 _view 欄位 */
async function resolveMediaArray(mediaArr, token) {
  const trySign = async (gcsUri) => {
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
    const direct = m?.authenticated_url || m?.url || m?.image_url;

    if (direct) {
      out.push({ ...m, _view: direct });
      continue;
    }

    const gcs = m?.gcs_uri || m?.image || null;
    if (!gcs) {
      out.push(m);
      continue;
    }

    let signed = await trySign(gcs);
    if (!signed) {
      signed = resolveGcsUrl(gcs);
    }
    out.push({ ...m, _view: signed });
  }
  return out;
}

export default function HomePost() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const controller = new AbortController();

    // 從 sessionStorage 恢復搜尋狀態
    const restoreSearchState = () => {
      try {
        const savedQuery = sessionStorage.getItem('homepost_search_query');
        const savedResults = sessionStorage.getItem('homepost_search_results');
        
        if (savedQuery && savedResults) {
          setSearchQuery(savedQuery);
          
          const results = JSON.parse(savedResults);
          const processSearchResults = async () => {
            const hydrated = [];
            
            for (const post of results) {
              let mediaArr = [];
              
              try {
                if (Array.isArray(post.media)) {
                  mediaArr = post.media;
                } else if (typeof post.media === 'string') {
                  mediaArr = JSON.parse(post.media || "[]");
                }
              } catch (e) {
                console.error(`解析貼文 ${post.id} 的 media 失敗:`, e);
              }
              
              // 檢查後端是否已經提供了簽署的 URL
              const processedMedia = mediaArr.map(m => {
                // 後端已經在 m.url 中提供簽署的 URL
                if (m?.url) {
                  return { ...m, _view: m.url };
                }
                if (m?.authenticated_url) {
                  return { ...m, _view: m.authenticated_url };
                }
                if (m?.image_url) {
                  return { ...m, _view: m.image_url };
                }
                // 如果後端沒有提供 URL，嘗試自己處理 gcs_uri
                if (m?.gcs_uri) {
                  return { ...m, _view: resolveGcsUrl(m.gcs_uri) };
                }
                return m;
              });
              
              hydrated.push({ 
                ...post, 
                _mediaArr: processedMedia 
              });
            }

            setPosts(hydrated);
            setLoading(false);
          };
          
          processSearchResults();
          return true;
        }
      } catch (e) {
        console.error('恢復搜尋狀態失敗:', e);
      }
      return false;
    };

    const fetchPublicPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        // 讀取所有 visibility=public 的貼文
        const res = await fetch(`${API_BASE}/posts/?visibility=public&limit=50`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          console.warn(`讀取公開貼文失敗 (${res.status})`);
          setPosts([]);
          return;
        }

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

        // 逐篇解析 media
        const hydrated = [];
        for (const it of prelim) {
          const resolved = await resolveMediaArray(it._mediaArr, token);
          hydrated.push({ ...it, _mediaArr: resolved });
        }

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

    // 監聽搜尋事件
    const handleSearchPosts = (event) => {
      const { query, results, loading: searchLoading, error: searchError } = event.detail;
      
      setSearchQuery(query || '');
      
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
        // 收到搜尋結果，處理後顯示
        const processSearchResults = async () => {
          // 儲存搜尋狀態到 sessionStorage
          try {
            sessionStorage.setItem('homepost_search_query', query);
            sessionStorage.setItem('homepost_search_results', JSON.stringify(results));
          } catch (e) {
            console.error('儲存搜尋狀態失敗:', e);
          }
          
          const hydrated = [];
          
          for (const post of results) {
            let mediaArr = [];
            
            // 解析 media 欄位
            try {
              if (Array.isArray(post.media)) {
                // 後端已經返回解析好的陣列
                mediaArr = post.media;
              } else if (typeof post.media === 'string') {
                mediaArr = JSON.parse(post.media || "[]");
              }
            } catch (e) {
              console.error(`解析貼文 ${post.id} 的 media 失敗:`, e, post.media);
            }
            
            console.log(`🔍 搜尋結果 - 貼文 ${post.id} 原始 media:`, mediaArr);
            
            // 檢查後端是否已經提供了簽署的 URL
            const processedMedia = mediaArr.map(m => {
              // 後端已經在 m.url 中提供簽署的 URL
              if (m?.url) {
                console.log(`✅ 貼文 ${post.id} 已有簽署 URL:`, m.url);
                return { ...m, _view: m.url };
              }
              // 備用：檢查其他可能的 URL 欄位
              if (m?.authenticated_url) {
                console.log(`✅ 貼文 ${post.id} 使用 authenticated_url:`, m.authenticated_url);
                return { ...m, _view: m.authenticated_url };
              }
              if (m?.image_url) {
                console.log(`✅ 貼文 ${post.id} 使用 image_url:`, m.image_url);
                return { ...m, _view: m.image_url };
              }
              // 如果後端沒有提供 URL，嘗試自己處理 gcs_uri
              if (m?.gcs_uri) {
                console.log(`⚠️ 貼文 ${post.id} 只有 gcs_uri，嘗試轉換:`, m.gcs_uri);
                const converted = resolveGcsUrl(m.gcs_uri);
                return { ...m, _view: converted };
              }
              console.warn(`❌ 貼文 ${post.id} 的 media 項目沒有可用的 URL:`, m);
              return m;
            });
            
            console.log(`🔍 貼文 ${post.id} 處理後的 media:`, processedMedia);
            
            hydrated.push({ 
              ...post, 
              _mediaArr: processedMedia 
            });
          }

          setPosts(hydrated);
          setLoading(false);
        };
        
        processSearchResults();
      } else if (query === '') {
        // 清空搜尋，重新載入所有公開貼文
        // 清除 sessionStorage 中的搜尋狀態
        try {
          sessionStorage.removeItem('homepost_search_query');
          sessionStorage.removeItem('homepost_search_results');
        } catch (e) {
          console.error('清除搜尋狀態失敗:', e);
        }
        fetchPublicPosts();
      }
    };

    // 初次載入時，先嘗試恢復搜尋狀態
    const restored = restoreSearchState();
    
    if (!restored) {
      // 如果沒有保存的搜尋狀態，載入所有公開貼文
      fetchPublicPosts();
    }

    // 監聽新貼文事件
    const handlePostCreated = () => {
      if (!searchQuery) {
        fetchPublicPosts();
      }
    };
    
    window.addEventListener("post-created", handlePostCreated);
    window.addEventListener("search-posts", handleSearchPosts);

    return () => {
      controller.abort();
      window.removeEventListener("post-created", handlePostCreated);
      window.removeEventListener("search-posts", handleSearchPosts);
    };
  }, []);

  if (loading) {
    return (
      <div className="text-center text-slate-500 py-8">
        {searchQuery ? `搜尋「${searchQuery}」中...` : '載入貼文中...'}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">
        {error}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8">
        {searchQuery ? `找不到與「${searchQuery}」相關的貼文` : '目前沒有公開貼文'}
      </div>
    );
  }

  return (
    <>
      {searchQuery && (
        <div className="mb-4 text-sm text-slate-600">
          搜尋「<span className="font-semibold">{searchQuery}</span>」的結果：共 {posts.length} 篇貼文
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map((post) => {
          const coverUrl = pickCoverUrl(post._mediaArr);
          
          // 臨時除錯：顯示 media 資訊
          if (!coverUrl) {
            console.warn(`⚠️ 貼文 ${post.id} 無封面圖:`, {
              mediaArr: post._mediaArr,
              media: post.media,
              title: post.title
            });
          }
          
          return (
            <PostCard
              key={post.id}
              imageUrl={coverUrl}
              alt={post.title || "貼文"}
              likes={post.like_count ?? 0}
              to={`/posts/${post.id}`}
            />
          );
        })}
      </div>
    </>
  );
}
