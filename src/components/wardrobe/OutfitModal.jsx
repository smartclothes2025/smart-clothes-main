// src/components/OutfitModal.jsx
import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { SparklesIcon, TagIcon, PencilSquareIcon } from "@heroicons/react/20/solid";

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

export default function OutfitModal({ date, outfit, onClose }) {
  if (!date) return null;

  // 日期
  const dateLabel = new Date(date).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const imageUrl = resolveImageUrl(outfit?.img || outfit?.image_url || null);

  const tags = outfit?.tags
    ? outfit.tags.split(/[,\s]+/).filter(Boolean)
    : [];

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

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >

      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
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

        <div className="overflow-y-auto flex-1 px-6 py-4">

          {/* 圖片區 */}
          <div className="w-full aspect-[3/4] bg-slate-50 rounded-2xl mb-4 flex items-center justify-center overflow-hidden shadow border border-slate-100">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={outfit?.name || "穿搭照片"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement.innerHTML =
                    `<span class="text-slate-400 text-sm">圖片載入失敗 😢</span>`;
                }}
              />
            ) : (
              <div className="text-slate-400 text-sm p-4 text-center">
                <SparklesIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                尚未上傳該日穿搭
              </div>
            )}
          </div>

          <div className="space-y-3 text-sm">
            <InfoCard
              title="穿搭標題"
              icon={<PencilSquareIcon className="w-4 h-4 text-indigo-500" />}
            >
              <div className="text-base font-semibold text-slate-800">
                {outfit?.name || ""}
              </div>
            </InfoCard>

            <InfoCard
              title="穿搭筆記"
              icon={<PencilSquareIcon className="w-4 h-4 text-cyan-500" />}
            >
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                {outfit?.description || "這個穿搭沒有留下任何備註。"}
              </div>
            </InfoCard>

            <InfoCard
              title="分類標籤"
              icon={<TagIcon className="w-4 h-4 text-pink-500" />}
            >
              <div className="flex flex-wrap gap-2 mt-1">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400">尚未新增任何標籤</span>
                )}
              </div>
            </InfoCard>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end rounded-b-2xl">
          <button
            onClick={() => onClose(false)}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm"
          >
            關閉視窗
          </button>
        </div>

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
  date: PropTypes.instanceOf(Date),
  outfit: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
