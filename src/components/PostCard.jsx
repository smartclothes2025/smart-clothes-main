// src/components/PostCard.jsx
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { HeartIcon } from "@heroicons/react/24/outline";
import { getCachedObjectUrl } from "../lib/imageCache";
import { stripQuery } from "../hooks/usePostsFeed";

export default function PostCard({
  imageUrl,
  postId,            // ← 新增：用來刷新簽名網址
  alt = "Post",
  likes = 0,
  to,
  onClick,
  cacheKey,
}) {
  const navigate = useNavigate();
  const [resolvedSrc, setResolvedSrc] = useState(null);
  const [loading, setLoading] = useState(!!imageUrl);

  function handleClick() {
    if (onClick) onClick();
    else if (to) navigate(to);
  }

  const stableKey = useMemo(() => cacheKey || stripQuery(imageUrl || ""), [cacheKey, imageUrl]);

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!imageUrl) { setResolvedSrc(null); setLoading(false); return; }
      setLoading(true);
      try {
        const src = await getCachedObjectUrl(imageUrl, stableKey);
        if (alive) setResolvedSrc(src);     // Blob/ObjectURL
      } catch {
        if (alive) setResolvedSrc(imageUrl); // Fallback: <img src>
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [imageUrl, stableKey]);

  // 圖片過期或 403 時自動刷新
  async function handleImgError() {
    try {
      if (!postId) return; // 沒 postId 就不刷新
      // 假設你在後端有提供：GET /api/v1/posts/{postId}/signed-url
      const res = await fetch(`/api/v1/posts/${postId}/signed-url`);
      if (!res.ok) return;
      const data = await res.json();
      const newUrl = data?.signed_url || data?.url || null;
      if (!newUrl) return;
      // 重新套用快取流程
      try {
        const src = await getCachedObjectUrl(newUrl, stripQuery(newUrl));
        setResolvedSrc(src);
      } catch {
        setResolvedSrc(newUrl);
      }
    } catch {
      // 真的不行就保持原樣（顯示失敗框）
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative block w-full rounded-xl overflow-hidden bg-slate-200 ring-1 ring-slate-200 hover:ring-indigo-300 transition"
      aria-label={alt}
      style={{ maxHeight: "300px" }}
    >
      {loading ? (
        <div className="w-full h-48 flex items-center justify-center bg-slate-100">
          <span className="text-slate-400 text-sm">載入中…</span>
        </div>
      ) : resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={alt}
          className="w-full h-auto object-contain"
          style={{ maxHeight: "300px" }}
          loading="lazy"
          onError={handleImgError}
        />
      ) : (
        <div className="w-full h-48 flex items-center justify-center bg-slate-200">
          <span className="text-slate-400 text-sm">無圖片</span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <HeartIcon className="w-6 h-6 text-white" />
          <span className="text-white font-bold text-lg">{likes}</span>
        </div>
      </div>
    </button>
  );
}

PostCard.propTypes = {
  imageUrl: PropTypes.string,
  postId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  alt: PropTypes.string,
  likes: PropTypes.number,
  to: PropTypes.string,
  onClick: PropTypes.func,
  cacheKey: PropTypes.string,
};
