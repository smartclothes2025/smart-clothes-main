// src/components/PostCard.jsx
import React from "react";
import PropTypes from "prop-types";
import { HeartIcon } from "@heroicons/react/24/outline";

const PLACEHOLDER = "/images/placeholder-400.png"; // 改成你專案的 placeholder 路徑

const PostCard = ({ imageUrl, alt = "Post", likes = 0 }) => {
  const src = imageUrl || PLACEHOLDER;

  return (
    <div className="aspect-square bg-slate-200 rounded-xl overflow-hidden group relative">
      {/* <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = PLACEHOLDER;
        }}
      /> */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
        <div
          className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          aria-hidden="true"
        >
          <HeartIcon className="w-6 h-6 text-white" />
          <span className="text-white font-bold text-lg">{likes}</span>
        </div>
      </div>
    </div>
  );
};

PostCard.propTypes = {
  imageUrl: PropTypes.string,
  alt: PropTypes.string,
  likes: PropTypes.number,
};

export default PostCard;
