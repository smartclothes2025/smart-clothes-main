// src/admin/Clothes.jsx
import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import StyledButton from "../components/ui/StyledButton";
import Page from "../components/Page";
import { Icon } from "@iconify/react";
import "../assets/TableStyles.css";
export default function AdminClothes() {
  const [users, setUsers] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const API_BASE = import.meta.env.VITE_API_BASE || ""; // 例如 http://127.0.0.1:8000/api/v1
  const SERVER_ORIGIN = useMemo(() => (API_BASE || "").replace(/\/api\/v1\/?$/, ""), [API_BASE]);

  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    (async () => {
      const map = await fetchUsers();
      await loadFromApi(map);
    })();
  }, []);

  async function fetchUsers() {
    try {
      const token = localStorage.getItem('token');
      const url = new URL(`${API_BASE}/auth/users`);
      url.searchParams.set('limit', '1000');
      const res = await fetch(url.toString(), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;
      setUsers(data);
      const map = {};
      data.forEach(u => {
        if (u?.id !== undefined) map[String(u.id)] = u.display_name || u.username || u.name || u.email || String(u.id);
      });
      setUsersMap(map);
      return map;
    } catch (err) {
      console.warn('fetchUsers failed', err);
    }
  }

  async function loadFromApi(usersMapArg = null) {
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("token");
      // 嘗試多個可能回傳「所有衣服」的 endpoint（包含 admin 路徑與不同 router mount）
      const candidates = [
        `${API_BASE}/admin/clothes?limit=1000`,
        `${API_BASE}/admin/wardrobe/clothes?limit=1000`,
        `${API_BASE}/api/v1/clothes?limit=1000`,
        `${API_BASE}/api/v1/wardrobe/clothes?limit=1000`,
        `${API_BASE}/clothes?limit=1000`,
        `${API_BASE}/wardrobe/clothes?limit=1000`,
        `/admin/clothes?limit=1000`,
        `/admin/wardrobe/clothes?limit=1000`,
        `/api/v1/clothes?limit=1000`,
        `/api/v1/wardrobe/clothes?limit=1000`,
        `/clothes?limit=1000`,
        `/wardrobe/clothes?limit=1000`,
      ];

      let data = null;
      let lastInfo = null;
      for (const url of candidates) {
        try {
          // 管理端不帶 token，才能取得所有用戶的衣服
          const res = await fetch(url, { headers: { Accept: 'application/json' } });
          if (!res.ok) {
            const txt = await res.text().catch(() => '');
            lastInfo = { url, status: res.status, text: txt };
            continue;
          }
          data = await res.json();
          break;
        } catch (err) {
          lastInfo = err;
        }
      }
      if (!data) throw new Error(`fetch failed for all candidates: ${JSON.stringify(lastInfo)}`);

      // 正規化為衣物資料：保留 user display_name、clothes name、category、updated
      const usersMapLocal = usersMapArg || usersMap || {};
      const normalized = (Array.isArray(data) ? data : []).map((r, idx) => {
        const id = r.id ?? r.clothes_id ?? idx + 1;
        const name = r.name ?? r.title ?? r.filename ?? r.image ?? "未命名";
        const category = r.category ?? r.type ?? r.category_name ?? "未分類";
        let updated_at = r.updated_at ?? r.updatedAt ?? r.modified_at ?? r.modified ?? r.updated ?? r.created_at ?? null;
        // 嘗試解析為可被 new Date() 處理的格式
        try {
          if (updated_at) {
            const d = new Date(updated_at);
            if (!isNaN(d.getTime())) updated_at = d.toISOString();
            else updated_at = null;
          }
        } catch (e) { updated_at = null; }
        // user info may be nested or as user_id/display_name
        // 優先用 user_id 對應使用者表的 display name
        const uid = r.user_id ?? r.owner ?? r.user ?? r.userId ?? r.owner_id ?? null;
        let user_display = null;
        if (uid && usersMapLocal?.[String(uid)]) {
          user_display = usersMapLocal[String(uid)];
        } else if (r.owner_display_name) {
          user_display = r.owner_display_name;
        } else if (r.user_display_name) {
          user_display = r.user_display_name;
        } else if (r.user_name) {
          user_display = r.user_name;
        } else if (uid) {
          user_display = String(uid);
        } else {
          user_display = "-";
        }

        // 推測圖片檔名或 URL
        const filename = r.filename ?? r.image ?? r.img ?? r.cover_image ?? r.cover_image_url ?? "";
        let image_url = "";
        if (filename) {
          if (typeof filename === 'string' && (filename.startsWith('http://') || filename.startsWith('https://'))) {
            image_url = filename;
          } else if (typeof filename === 'string' && filename.startsWith('/')) {
            // 相對路徑，補上 API_BASE 的 host
            image_url = `${API_BASE.replace(/\/$/, '')}${filename}`;
          } else {
            image_url = `${SERVER_ORIGIN.replace(/\/$/, '')}/uploads/${filename}`;
          }
        }

        return {
          id,
          name,
          category,
          updated_at,
          user_display,
          image_url,
          raw: r,
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
      const byQ = !q || `${it.name || ""}`.toLowerCase().includes(q) || `${it.user_display || ""}`.toLowerCase().includes(q);
      const byU = !uf || `${it.user_display || ""}`.toLowerCase().includes(uf);
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

  async function handleDeleteClothes(id) {
    if (!confirm('確定要刪除此衣物？此操作無法復原。')) return;
    setLoading(true);
    const token = localStorage.getItem('token');
    const candidates = [
      `${API_BASE}/clothes/${id}`,
      `${API_BASE}/wardrobe/clothes/${id}`,
      `${API_BASE}/api/v1/clothes/${id}`,
      `${API_BASE}/api/v1/wardrobe/clothes/${id}`,
      `/clothes/${id}`,
      `/wardrobe/clothes/${id}`,
    ];
    let lastErr = null;
    for (const url of candidates) {
      try {
        const res = await fetch(url, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) {
          lastErr = await res.text().catch(() => '');
          continue;
        }
        setAllItems(prev => prev.filter(x => x.id !== id));
        setLoading(false);
        return;
      } catch (err) {
        lastErr = err;
      }
    }
    setLoading(false);
    alert('刪除失敗：' + (lastErr?.toString?.() || '未知錯誤'));
  }

  return (
    <div>
      <Layout title="衣櫃管理" />
      <div className="bankpage-wrapper bg-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              placeholder="使用者名稱"
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              className="form-input w-56"
            />
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
              className="form-select-custom w-56" 
            >
              <option value="">所有分類</option>
              {Array.from(new Set(allItems.map(it => it.category).filter(Boolean))).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <StyledButton onClick={() => loadFromApi()}>重新載入</StyledButton>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 bg-white rounded-xl shadow ring-1 ring-black/5 overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="text-sm text-gray-700 bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-3 text-left w-[15%]">縮圖</th>
                <th className="p-3 text-left w-[20%]">使用者</th>
                <th className="p-3 text-left w-[20%]">衣物名稱</th>
                <th className="p-3 text-left w-[15%]">分類</th>
                <th className="p-3 text-left w-[20%]">更新時間</th>
                <th className="p-3 text-left w-[10%]">操作</th>
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
                  <tr key={item.id} className="border-t odd:bg-white even:bg-gray-50">
                    <td className="p-3">
                      <img src={item.image_url || '/images/placeholder-96.png'} alt={item.name} className="w-16 h-16 object-cover rounded" loading="lazy" onError={(e) => { e.currentTarget.src = '/images/placeholder-96.png'; }} />
                    </td>
                    <td className="p-3 truncate">{item.user_display}</td>
                    <td className="p-3 truncate">{item.name}</td>
                    <td className="p-3">{item.category}</td>
                    <td className="p-3 text-sm text-gray-500">{item.updated_at ? (new Date(item.updated_at).toLocaleDateString()) : '-'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleDeleteClothes(item.id)} className="px-2 py-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100">刪除</button>
                      </div>
                    </td>
                  </tr>
                ));
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
      </div>
    </div>
  );
}
