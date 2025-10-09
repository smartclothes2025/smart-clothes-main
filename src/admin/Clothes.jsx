// src/admin/Clothes.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";

export default function AdminClothes() {
  const API = import.meta.env.VITE_API_BASE || "";

  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [query, setQuery] = useState("");
  const [userFilter, setUserFilter] = useState(""); // 可輸入 user email 或 id
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // modals
  const [viewItem, setViewItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, userFilter, categoryFilter, statusFilter, page, pageSize]);

  async function fetchItems() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        user: userFilter,
        category: categoryFilter,
        status: statusFilter,
        page,
        pageSize,
      });
      const res = await fetch(`${API}/api/admin/clothes?${params.toString()}`, {
        headers: { "Accept": "application/json" },
      });
      if (!res.ok) {
        const t = await res.text().catch(() => null);
        throw new Error(t || "取得衣物列表失敗");
      }
      const d = await res.json();
      setItems(d.items || []);
      setTotal(d.total || 0);
    } catch (err) {
      console.error(err);
      alert(err.message || "取得失敗");
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }
  function selectAllOnPage() {
    const ids = items.map(i => i.id);
    setSelected(prev => {
      const s = new Set(prev);
      ids.forEach(id => s.add(id));
      return s;
    });
  }
  function clearSelection() { setSelected(new Set()); }

  // Open view modal
  function openView(item) {
    setViewItem(item);
  }

  // Open edit modal
  function openEdit(item) {
    setEditingItem({ ...item }); // copy
    setShowEditModal(true);
  }

  async function saveEdit() {
    if (!editingItem) return;
    const payload = {
      title: editingItem.title,
      description: editingItem.description,
      category: editingItem.category,
      color: editingItem.color,
      size: editingItem.size,
      status: editingItem.status,
    };
    try {
      const res = await fetch(`${API}/api/admin/clothes/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => null);
        throw new Error(t || "更新失敗");
      }
      setShowEditModal(false);
      fetchItems();
    } catch (err) {
      alert(err.message || "更新失敗");
    }
  }

  // batch action (hide / restore / delete)
  async function batchAction(action) {
    if (selected.size === 0) return alert("請先選取項目");
    if (!confirm(`確定要對 ${selected.size} 個項目執行 ${action} 嗎？`)) return;
    try {
      const res = await fetch(`${API}/api/admin/clothes/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => null);
        throw new Error(t || "批次操作失敗");
      }
      setSelected(new Set());
      fetchItems();
    } catch (err) {
      alert(err.message || "操作失敗");
    }
  }

  // single action for item (hide/unhide/delete)
  async function toggleHide(item) {
    const action = item.status === "active" ? "hide" : "restore";
    if (!confirm(`確定要 ${action} 這個項目嗎？`)) return;
    try {
      const res = await fetch(`${API}/api/admin/clothes/${item.id}/${action}`, { method: "POST" });
      if (!res.ok) {
        const t = await res.text().catch(() => null);
        throw new Error(t || "操作失敗");
      }
      fetchItems();
    } catch (err) {
      alert(err.message || "操作失敗");
    }
  }

  function exportCSV() {
    const params = new URLSearchParams({ q: query, user: userFilter, category: categoryFilter, status: statusFilter });
    window.open(`${API}/api/admin/clothes/export?${params.toString()}`, "_blank");
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API}/api/admin/clothes/import`, { method: "POST", body: fd });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "匯入失敗");
      }
      alert("匯入完成");
      fetchItems();
    } catch (err) {
      alert(err.message || "匯入失敗");
    } finally {
      e.target.value = null;
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  function gotoPage(n) { setPage(Math.max(1, Math.min(totalPages, n))); }

  return (
    <div>
      <Layout title="衣櫃管理" />
      <div className="pt-20 lg:pl-72 px-6 bg-gray-100 min-h-[calc(100vh-5rem)]">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              placeholder="搜尋標題 / 描述"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="px-3 py-2 border rounded w-64"
              onKeyDown={e => { if (e.key === "Enter") { setPage(1); fetchItems(); } }}
            />
            <input
              placeholder="使用者 Email 或 ID"
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
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border rounded">
              <option value="">所有狀態</option>
              <option value="active">active</option>
              <option value="hidden">hidden</option>
              <option value="removed">removed</option>
            </select>
            <button onClick={() => { setPage(1); fetchItems(); }} className="px-4 py-2 rounded bg-blue-600 text-white">查詢</button>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="file" accept=".csv" onChange={handleImportFile} className="hidden" />
              <span className="px-3 py-2 rounded bg-gray-100">匯入 CSV</span>
            </label>
            <button onClick={exportCSV} className="px-3 py-2 rounded bg-gray-100">匯出 CSV</button>
            <button onClick={() => selectAllOnPage()} className="px-3 py-2 rounded bg-gray-100">全選（本頁）</button>
            <button onClick={() => clearSelection()} className="px-3 py-2 rounded bg-gray-100">清除選取</button>
          </div>
        </div>

        {/* Selected toolbar */}
        {selected.size > 0 && (
          <div className="mt-3 bg-yellow-50 p-3 rounded flex items-center justify-between">
            <div>已選取 {selected.size} 個項目</div>
            <div className="flex items-center gap-2">
              <button onClick={() => batchAction("hide")} className="px-3 py-1 rounded bg-yellow-600 text-white">批次隱藏</button>
              <button onClick={() => batchAction("restore")} className="px-3 py-1 rounded bg-green-600 text-white">批次還原</button>
              <button onClick={() => batchAction("delete")} className="px-3 py-1 rounded bg-red-600 text-white">批次刪除</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="mt-4 bg-white rounded shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="text-sm text-gray-600 bg-gray-50">
              <tr>
                <th className="p-3 text-left"><input type="checkbox" onChange={e => e.target.checked ? selectAllOnPage() : clearSelection()} aria-label="全選" /></th>
                <th className="p-3 text-left">縮圖</th>
                <th className="p-3 text-left">標題</th>
                <th className="p-3 text-left">上傳者</th>
                <th className="p-3 text-left">分類</th>
                <th className="p-3 text-left">尺寸</th>
                <th className="p-3 text-left">顏色</th>
                <th className="p-3 text-left">狀態</th>
                <th className="p-3 text-left">註冊日</th>
                <th className="p-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" className="p-6 text-center">載入中...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="10" className="p-6 text-center">查無資料</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="border-t">
                  <td className="p-3"><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                  <td className="p-3">
                    <img src={item.image_url || item.thumbnail || '/images/placeholder-96.png'} alt={item.title} className="w-16 h-16 object-cover rounded" loading="lazy" onError={(e)=>{ e.target.src='/images/placeholder-96.png'; }} />
                  </td>
                  <td className="p-3">{item.title}</td>
                  <td className="p-3 text-sm text-gray-600">{item.user_email || item.user_id}</td>
                  <td className="p-3">{item.category}</td>
                  <td className="p-3">{item.size || "-"}</td>
                  <td className="p-3">{item.color || "-"}</td>
                  <td className="p-3">{item.status}</td>
                  <td className="p-3 text-sm text-gray-500">{item.created_at?.split?.("T")?.[0] || "-"}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openView(item)} className="px-2 py-1 rounded bg-gray-100">檢視</button>
                      <button onClick={() => openEdit(item)} className="px-2 py-1 rounded bg-gray-100">編輯</button>
                      <button onClick={() => toggleHide(item)} className="px-2 py-1 rounded bg-gray-100">{item.status === "active" ? "隱藏" : "還原"}</button>
                      <button onClick={() => { if (confirm("確定刪除此項目？（建議使用 soft-delete）")) { batchActionSingle(item.id, 'delete'); } }} className="px-2 py-1 rounded bg-red-100 text-red-600">刪除</button>
                    </div>
                  </td>
                </tr>
              ))}
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

        {/* View Modal */}
        {viewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setViewItem(null)} />
            <div className="bg-white rounded-lg shadow p-6 z-10 w-[min(900px,95%)] max-h-[90vh] overflow-auto">
              <div className="flex gap-4">
                <img src={viewItem.image_url || '/images/placeholder-320.png'} alt={viewItem.title} className="w-72 h-72 object-cover rounded" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{viewItem.title}</h3>
                  <p className="text-sm text-gray-600">{viewItem.description}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-700">
                    <div><strong>上傳者：</strong> {viewItem.user_email || viewItem.user_id}</div>
                    <div><strong>分類：</strong> {viewItem.category}</div>
                    <div><strong>尺寸：</strong> {viewItem.size}</div>
                    <div><strong>顏色：</strong> {viewItem.color}</div>
                    <div><strong>狀態：</strong> {viewItem.status}</div>
                    <div><strong>建立時間：</strong> {viewItem.created_at?.split?.("T")?.[0]}</div>
                  </dl>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setViewItem(null)} className="px-4 py-2 rounded bg-gray-100">關閉</button>
                <button onClick={() => { openEdit(viewItem); setViewItem(null); }} className="px-4 py-2 rounded bg-blue-600 text-white">編輯</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowEditModal(false)} />
            <div role="dialog" aria-modal="true" className="bg-white rounded-lg shadow p-6 z-10 w-[min(720px,95%)]">
              <h3 className="text-lg font-semibold">編輯衣物</h3>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <label className="flex flex-col">
                  <span className="text-sm text-gray-600">標題</span>
                  <input value={editingItem.title || ""} onChange={e => setEditingItem({ ...editingItem, title: e.target.value })} className="px-3 py-2 border rounded" />
                </label>
                <label className="flex flex-col">
                  <span className="text-sm text-gray-600">描述</span>
                  <textarea value={editingItem.description || ""} onChange={e => setEditingItem({ ...editingItem, description: e.target.value })} className="px-3 py-2 border rounded" rows={4} />
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex flex-col">
                    <span className="text-sm text-gray-600">分類</span>
                    <select value={editingItem.category || ""} onChange={e => setEditingItem({ ...editingItem, category: e.target.value })} className="px-3 py-2 border rounded">
                      <option value="">未分類</option>
                      <option value="top">上衣</option>
                      <option value="bottom">下身</option>
                      <option value="outer">外套</option>
                      <option value="shoes">鞋類</option>
                      <option value="accessory">配件</option>
                    </select>
                  </label>
                  <label className="flex flex-col">
                    <span className="text-sm text-gray-600">尺寸</span>
                    <input value={editingItem.size || ""} onChange={e => setEditingItem({ ...editingItem, size: e.target.value })} className="px-3 py-2 border rounded" />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-sm text-gray-600">顏色</span>
                    <input value={editingItem.color || ""} onChange={e => setEditingItem({ ...editingItem, color: e.target.value })} className="px-3 py-2 border rounded" />
                  </label>
                </div>

                <label className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">狀態</span>
                  <select value={editingItem.status || "active"} onChange={e => setEditingItem({ ...editingItem, status: e.target.value })} className="px-3 py-2 border rounded">
                    <option value="active">active</option>
                    <option value="hidden">hidden</option>
                    <option value="removed">removed</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded bg-gray-100">取消</button>
                <button onClick={saveEdit} className="px-4 py-2 rounded bg-blue-600 text-white">儲存</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // helper for single-delete using batch API
  async function batchActionSingle(id, action) {
    try {
      const res = await fetch(`${API}/api/admin/clothes/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], action }),
      });
      if (!res.ok) throw new Error("操作失敗");
      fetchItems();
    } catch (err) {
      alert(err.message || "操作失敗");
    }
  }
}
