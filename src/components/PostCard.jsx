// src/components/PostCard.jsx
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { HeartIcon } from "@heroicons/react/24/outline";
// import { getCachedObjectUrl } from "../lib/imageCache"; // 公開模式下不需要
import { stripQuery } from "../hooks/usePostsFeed";

function gsToPublicUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!url.startsWith("gs://")) return url;
  const without = url.replace("gs://", "");
  const slash = without.indexOf("/");
  if (slash <= 0) return url;
  const bucket = without.slice(0, slash);
  const object = encodeURI(without.slice(slash + 1));
  return `https://storage.googleapis.com/${bucket}/${object}`;
}

export default function PostCard({
  imageUrl,
  postId,
  alt = "Post",
  likes = 0,
  to,
  onClick,
  cacheKey,         // 公開模式其實用不到，但保留相容
  useSigned = false, // 🔁 新增：是否使用簽名 URL
  apiBase = "/api/v1", // 🔁 用於簽名模式
}) {
  const navigate = useNavigate();
  const [resolvedSrc, setResolvedSrc] = useState(null);
  const [loading, setLoading] = useState(!!imageUrl);
  const stableKey = useMemo(() => cacheKey || stripQuery(imageUrl || ""), [cacheKey, imageUrl]);

  function handleClick() {
    if (onClick) onClick();
    else if (to) navigate(to);
  }

  async function fetchSignedUrl() {
    if (!postId) return null;
    try {
      const res = await fetch(`${apiBase}/posts/${postId}/signed-url`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.signed_url || data?.url || null;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!imageUrl) { if (alive) { setResolvedSrc(null); setLoading(false); } return; }
      setLoading(true);

      if (useSigned) {
        // 簽名模式：先拿簽名 URL，再顯示
        const signed = await fetchSignedUrl();
        const finalUrl = signed || imageUrl;
        if (alive) setResolvedSrc(finalUrl);
        setLoading(false);
      } else {
        // 公開模式：不打簽名；若是 gs:// 轉 https 公開網址
        const publicUrl = gsToPublicUrl(imageUrl);
        if (alive) setResolvedSrc(publicUrl);
        setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [imageUrl, useSigned, postId, apiBase, stableKey]);

  async function handleImgError() {
    if (!useSigned) return;  // 公開模式就讓它走 onError 後備圖即可
    const signed = await fetchSignedUrl();
    if (!signed) return;
    setResolvedSrc(signed);
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
          decoding="async"
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
  useSigned: PropTypes.bool,     // 🔁
  apiBase: PropTypes.string,     // 🔁
};
