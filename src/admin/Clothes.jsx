// src/admin/Clothes.jsx（唯讀版，資料來自使用者介面 API: /api/v1/clothes）
import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";

export default function AdminClothes() {
  const API_BASE = import.meta.env.VITE_API_BASE || ""; // 例如 http://127.0.0.1:8000/api/v1
  const SERVER_ORIGIN = useMemo(() => API_BASE.replace(/\/api\/v1\/?$/, ""), [API_BASE]);

  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 客端篩選/分頁條件（唯讀）
  const [query, setQuery] = useState("");
  const [userFilter, setUserFilter] = useState(""); // 以 user_id 篩選（字串包含）
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    loadFromApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadFromApi() {
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("token");
      // 後端目前僅提供 /api/v1/clothes?limit=... 回傳陣列，這裡抓多一點由前端分頁
      const url = `${API_BASE}/clothes?limit=1000`;
      const res = await fetch(url, {
        headers: {
          "Accept": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      // 正規化欄位，盡量對齊 UI 需求；若缺少欄位則給預設值
      const normalized = (Array.isArray(data) ? data : []).map((r, idx) => {
        const id = r.id ?? r.clothes_id ?? idx + 1;
        const filename = r.filename ?? r.image ?? r.name ?? "";
        const category = r.category ?? r.type ?? "未分類";
        const color = r.color ?? (Array.isArray(r.colors) ? r.colors.join(", ") : r.colors) ?? "-";
        const user_id = r.user_id ?? r.user ?? "-";
        const created_at = r.created_at ?? r.createdAt ?? r.created ?? null;
        const image_url = filename ? `${SERVER_ORIGIN}/uploaded_images/${filename}` : "";
        return {
          id,
          title: (r.title ?? filename) || "未命名",
          user_id: String(user_id),
          category,
          size: r.size ?? "-",
          color,
          created_at,
          image_url,
        };
      });
      setAllItems(normalized);
      setPage(1);
    } catch (e) {
      console.error(e);
      setError(e?.message || "讀取失敗");
    } finally {
      setLoading(false);
    }
  }

  // 客端篩選
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const uf = userFilter.trim().toLowerCase();
    return allItems.filter(it => {
      const byQ = !q || `${it.title || ""}`.toLowerCase().includes(q);
      const byU = !uf || `${it.user_id || ""}`.toLowerCase().includes(uf);
      const byC = !categoryFilter || `${it.category || ""}`.toLowerCase().includes(categoryFilter.toLowerCase());
      return byQ && byU && byC;
    });
  }, [allItems, query, userFilter, categoryFilter]);

  // 分頁
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function gotoPage(n) { setPage(Math.max(1, Math.min(totalPages, n))); }

  return (
    <div>
      <Layout title="衣櫃管理" />
      <div className="bankpage-wrapper bg-gray-100">
        {/* Toolbar（唯讀：無批次/匯入匯出） */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              placeholder="搜尋標題"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="px-3 py-2 border rounded w-64"
              onKeyDown={e => { if (e.key === "Enter") setPage(1); }}
            />
            <input
              placeholder="使用者 ID"
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              className="px-3 py-2 border rounded w-56"
            />
            <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded">
              <option value="">所有分類</option>
              <option value="top">上衣</option>
              <option value="bottom">下身</option>
              <option value="outer">外套</option>
              <option value="shoes">鞋類</option>
              <option value="accessory">配件</option>
            </select>
            <button onClick={() => loadFromApi()} className="px-4 py-2 rounded bg-blue-600 text-white">重新載入</button>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 bg-white rounded shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="text-sm text-gray-600 bg-gray-50">
              <tr>
                <th className="p-3 text-left">縮圖</th>
                <th className="p-3 text-left">標題</th>
                <th className="p-3 text-left">上傳者ID</th>
                <th className="p-3 text-left">分類</th>
                <th className="p-3 text-left">顏色</th>
                <th className="p-3 text-left">建立日</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                if (loading) {
                  return (
                    <tr>
                      <td colSpan="6" className="p-6 text-center">載入中...</td>
                    </tr>
                  );
                }
                if (error) {
                  return (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-red-600">{error}</td>
                    </tr>
                  );
                }
                if (pageItems.length === 0) {
                  return (
                    <tr>
                      <td colSpan="6" className="p-6 text-center">查無資料</td>
                    </tr>
                  );
                }
                return pageItems.map(item => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3">
                      <img src={item.image_url || '/images/placeholder-96.png'} alt={item.title} className="w-16 h-16 object-cover rounded" loading="lazy" onError={(e)=>{ e.currentTarget.src='/images/placeholder-96.png'; }} />
                    </td>
                    <td className="p-3">{item.title}</td>
                    <td className="p-3 text-sm text-gray-600">{item.user_id}</td>
                    <td className="p-3">{item.category}</td>
                    <td className="p-3">{item.color}</td>
                    <td className="p-3 text-sm text-gray-500">{item.created_at?.split?.("T")?.[0] || "-"}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">共 {total} 筆</div>
          <div className="flex items-center gap-2">
            <button onClick={() => gotoPage(1)} disabled={page === 1} className="px-3 py-1 rounded bg-gray-100">第一頁</button>
            <button onClick={() => gotoPage(page - 1)} disabled={page === 1} className="px-3 py-1 rounded bg-gray-100">上一頁</button>
            <span className="px-2">第 {page} / {totalPages} 頁</span>
            <button onClick={() => gotoPage(page + 1)} disabled={page === totalPages} className="px-3 py-1 rounded bg-gray-100">下一頁</button>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="px-2 py-1 border rounded">
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
