// src/components/PostCard.jsx
import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { HeartIcon } from "@heroicons/react/24/outline";

export default function PostCard({ imageUrl, alt = "Post", likes = 0, to }) {
  const navigate = useNavigate();
  const src = imageUrl;

  function handleClick() {
    if (to) navigate(to);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative block w-full aspect-square rounded-xl overflow-hidden bg-slate-200 ring-1 ring-slate-200 hover:ring-indigo-300 transition"
      aria-label={alt}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-200">
          <span className="text-slate-400 text-sm">無圖片</span>
        </div>
      )}

      {/* hover 資訊層，不阻擋點擊 */}
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
  alt: PropTypes.string,
  likes: PropTypes.number,
  to: PropTypes.string,            // ← 新增：點卡片導向
};
