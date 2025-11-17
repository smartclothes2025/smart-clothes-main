import React, { useMemo, useState, useEffect as ReactUseEffect } from "react";
import Layout from "../components/Layout";
import StyledButton from "../components/ui/StyledButton";
import Page from "../components/Page";
import "../assets/TableStyles.css";
import AskModal from "../components/AskModal";
import useSWR from "swr";
import fetchJSON from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { getCachedObjectUrl } from "../lib/imageCache";
import { stripQuery } from "../hooks/usePostsFeed";

/* ------------------------ 解析 media 封面圖 ------------------------ */
function getPostCoverImage(media) {
  if (!media) return null;
  let mediaArr = [];
  try {
    if (Array.isArray(media)) mediaArr = media;
    else if (typeof media === "string") mediaArr = JSON.parse(media || "[]");
  } catch {}
  if (mediaArr.length === 0) return null;
  const cover = mediaArr.find((m) => m?.is_cover) || mediaArr[0];
  const rawUrl =
    cover?.url ||
    cover?.authenticated_url ||
    cover?.image_url ||
    cover?.gcs_uri ||
    cover?.image ||
    null;

  if (rawUrl && rawUrl.startsWith("gs://")) {
    const without = rawUrl.replace("gs://", "");
    const slash = without.indexOf("/");
    if (slash > 0) {
      const bucket = without.slice(0, slash);
      const object = encodeURI(without.slice(slash + 1));
      return `https://storage.googleapis.com/${bucket}/${object}`;
    }
  }
  return rawUrl;
}

/* ------------------- 後臺縮圖（簽名 URL + 快取 + 自動刷新） ------------------- */
function AdminPostThumb({ imageUrl, postId, alt = "Post", apiBase }) {
  const [resolvedSrc, setResolvedSrc] = useState(null);
  const [loading, setLoading] = useState(!!imageUrl);

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

  ReactUseEffect(() => {
    let alive = true;
    async function run() {
      if (!imageUrl) {
        if (alive) {
          setResolvedSrc(null);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      const signed = await fetchSignedUrl();
      const finalUrl = signed || imageUrl;
      const cacheKey = stripQuery(finalUrl);

      try {
        const src = await getCachedObjectUrl(finalUrl, cacheKey);
        if (alive) setResolvedSrc(src);
      } catch {
        if (alive) setResolvedSrc(finalUrl);
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [imageUrl, postId, apiBase]);

  async function handleImgError() {
    const signed = await fetchSignedUrl();
    if (!signed) return;
    try {
      const src = await getCachedObjectUrl(signed, stripQuery(signed));
      setResolvedSrc(src);
    } catch {
      setResolvedSrc(signed);
    }
  }

  if (loading)
    return (
      <div className="w-16 h-16 flex items-center justify-center bg-slate-100 rounded">
        <span className="text-slate-400 text-xs">載入中…</span>
      </div>
    );
  if (!resolvedSrc)
    return (
      <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded text-gray-400 text-xs">
        無圖
      </div>
    );
  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className="w-16 h-16 object-contain rounded bg-white"
      loading="lazy"
      onError={handleImgError}
    />
  );
}

export default function AdminPosts() {
  const { addToast } = useToast();
  const API_BASE = import.meta.env.VITE_API_BASE || "";

  const cacheKey = `${API_BASE}/posts?limit=1000&scope=all`;
  const { data, error, isLoading, mutate } = useSWR(cacheKey, fetchJSON);

  // ✅ 原始貼文陣列（不要用 filtered 來算 KPI）
  const allItems = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    return [];
  }, [data]);

  // ✅ 原始總數（KPI 用）
  const postsTotalRaw = allItems.length;

  // ✅ 寫回正確的 key（>0 才寫）
  ReactUseEffect(() => {
    try {
      if (postsTotalRaw > 0) {
        localStorage.setItem("kpi:postsTotal", String(postsTotalRaw));
      }
    } catch {}
  }, [postsTotalRaw]);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [askOpen, setAskOpen] = useState(false);
  const [askTargetId, setAskTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((it) => {
      return (
        (it.title || "").toLowerCase().includes(q) ||
        (it.content || "").toLowerCase().includes(q) ||
        (it.display_name || it.author_name || "").toLowerCase().includes(q) ||
        String(it.id).includes(q)
      );
    });
  }, [allItems, query]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function gotoPage(n) {
    setPage(Math.max(1, Math.min(totalPages, n)));
  }

  async function handleDeletePost(id) {
    if (isDeleting) return;
    setIsDeleting(true);

    mutate(
      (current) => {
        if (!current) return current;
        const keep = (r) => String(r?.id) !== String(id);
        if (Array.isArray(current)) return current.filter(keep);
        if (Array.isArray(current.items))
          return { ...current, items: current.items.filter(keep) };
        return current;
      },
      { revalidate: false }
    );

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => `HTTP ${res.status}`);
        let detail = txt;
        try {
          const parsed = JSON.parse(txt);
          detail = parsed?.detail || txt;
        } catch {}
        throw new Error(detail);
      }

      addToast({ type: "success", title: "刪除成功", message: `貼文 #${id} 已移除` });
      mutate();
    } catch (err) {
      addToast({ type: "error", title: "刪除失敗", message: err.message });
      mutate();
    } finally {
      setIsDeleting(false);
      setAskOpen(false);
      setAskTargetId(null);
    }
  }

  function openAskModal(id) {
    setAskTargetId(id);
    setAskOpen(true);
  }

  return (
    <div>
      <Layout title="貼文管理" />
      <div className="bankpage-wrapper bg-gray-100">
        <div className="flex items-center gap-2">
          <input
            className="form-input w-56"
            placeholder="搜尋標題、內容或作者"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
          <StyledButton onClick={() => mutate()}>重新載入</StyledButton>
        </div>

        <div className="mt-4 bg-white rounded-xl shadow ring-1 ring-black/5 overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="text-sm text-gray-700 bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-3 text-left w-[15%]">縮圖</th>
                <th className="p-3 text-left w-[25%]">標題</th>
                <th className="p-3 text-left w-[30%]">內容 (片段)</th>
                <th className="p-3 text-left w-[15%]">作者</th>
                <th className="p-3 text-left w-[15%]">操作</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                if (isLoading && allItems.length === 0)
                  return (
                    <tr>
                      <td colSpan="5" className="p-6 text-center">
                        載入中...
                      </td>
                    </tr>
                  );
                if (error)
                  return (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-red-600">
                        {error.message}
                      </td>
                    </tr>
                  );
                if (pageItems.length === 0)
                  return (
                    <tr>
                      <td colSpan="5" className="p-6 text-center">
                        查無資料
                      </td>
                    </tr>
                  );

                return pageItems.map((item) => {
                  const cover = getPostCoverImage(item.media);
                  const authorDisplay =
                    item.display_name ||
                    item.author_display_name ||
                    item.author_name ||
                    "(無作者)";
                  return (
                    <tr
                      key={item.id}
                      className="border-t odd:bg-white even:bg-gray-50"
                    >
                      <td className="p-3">
                        <AdminPostThumb
                          imageUrl={cover}
                          postId={item.id}
                          alt={item.title || "Post"}
                          apiBase={API_BASE}
                        />
                      </td>
                      <td className="p-3 truncate font-medium">
                        {item.title || "(無標題)"}
                      </td>
                      <td className="p-3 truncate text-sm text-gray-500">
                        {item.content || "(無內容)"}
                      </td>
                      <td className="p-3 truncate text-sm">{authorDisplay}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openAskModal(item.id)}
                            className="px-2 py-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100"
                            disabled={isDeleting}
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>

        <Page
          page={page}
          totalPages={totalPages}
          gotoPage={gotoPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          total={filtered.length}
        />

        <AskModal
          open={askOpen}
          title="刪除貼文"
          message={`確定要刪除貼文 #${askTargetId}？此操作無法復原。`}
          confirmText={isDeleting ? "刪除中..." : "刪除"}
          cancelText="取消"
          destructive={true}
          onCancel={() => {
            setAskOpen(false);
            setAskTargetId(null);
          }}
          onConfirm={() => {
            if (askTargetId) handleDeletePost(askTargetId);
          }}
        />
      </div>
    </div>
  );
}
