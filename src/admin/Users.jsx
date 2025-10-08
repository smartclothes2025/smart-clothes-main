// src/admin/Users.jsx
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Icon } from "@iconify/react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // modal state: edit & create
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", status: "active" });

  const [error, setError] = useState(null);

  const API = import.meta.env.VITE_API_BASE || ""; // use proxy or set env

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, statusFilter, page, pageSize]);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        query,
        status: statusFilter,
        page,
        pageSize,
      });
      const res = await fetch(`${API}/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("fetch users failed");
      const data = await res.json();
      setUsers(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.message || "取得列表失敗");
    } finally {
      setLoading(false);
    }
  }

  // selection helpers
  function toggleSelect(id) {
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }
  function selectAllOnPage() {
    const ids = users.map(u => u.id);
    setSelected(prev => {
      const s = new Set(prev);
      ids.forEach(id => s.add(id));
      return s;
    });
  }
  function clearSelection() { setSelected(new Set()); }

  // Edit modal
  function openEdit(user) {
    setEditingUser({ ...user });
    setShowEditModal(true);
  }
  async function saveEdit() {
    if (!editingUser) return;
    try {
      const res = await fetch(`${API}/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          status: editingUser.status,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "更新失敗");
      }
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.message || "更新失敗");
    }
  }

  // Create user
  function validateEmail(e) {
    return /\S+@\S+\.\S+/.test(e);
  }
  async function createUser() {
    // basic validation
    if (!newUser.name.trim()) return alert("請輸入姓名");
    if (!validateEmail(newUser.email)) return alert("請輸入有效 Email");
    if (newUser.password.length < 6) return alert("密碼至少 6 碼");

    try {
      const res = await fetch(`${API}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "建立失敗");
      }
      alert("建立成功");
      setShowCreateModal(false);
      setNewUser({ name: "", email: "", password: "", status: "active" });
      fetchUsers();
    } catch (err) {
      alert(err.message || "建立失敗");
    }
  }

  // ban/unban single
  async function toggleBan(user) {
    const action = user.status === "active" ? "ban" : "unban";
    if (!confirm(`確定要 ${action} ${user.name} 嗎？`)) return;
    try {
      const res = await fetch(`${API}/api/admin/users/${user.id}/${action}`, { method: "POST" });
      if (!res.ok) throw new Error("操作失敗");
      fetchUsers();
    } catch (err) {
      alert(err.message || "操作失敗");
    }
  }

  // batch action
  async function batchAction(action) {
    if (selected.size === 0) return alert("請先選取使用者");
    if (!confirm(`確定要對 ${selected.size} 個帳號執行 ${action} 嗎？`)) return;
    try {
      const res = await fetch(`${API}/api/admin/users/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });
      if (!res.ok) throw new Error("批次操作失敗");
      setSelected(new Set());
      fetchUsers();
    } catch (err) {
      alert(err.message || "操作失敗");
    }
  }

  // CSV export/import placeholders (keep as-is)
  function exportCSV() {
    const params = new URLSearchParams({ query, status: statusFilter });
    window.open(`${API}/api/admin/users/export?${params.toString()}`, "_blank");
  }
  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API}/api/admin/users/import`, { method: "POST", body: fd });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "匯入失敗");
      }
      alert("匯入完成");
      fetchUsers();
    } catch (err) {
      alert(err.message || "匯入失敗");
    } finally {
      e.target.value = null;
    }
  }

  // pagination
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  function gotoPage(n) { setPage(Math.max(1, Math.min(totalPages, n))); }

  return (
    <div>
      <Layout title="帳號管理" />
      <div className="bankpage-wrapper bg-gray-100">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              aria-label="搜尋使用者"
              placeholder="搜尋姓名或 Email"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="px-3 py-2 border rounded w-64"
              onKeyDown={(e)=>{ if(e.key==='Enter'){ setPage(1); fetchUsers(); }}}
            />
            <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value); setPage(1);}} className="px-3 py-2 border rounded">
              <option value="">所有狀態</option>
              <option value="active">active</option>
              <option value="banned">banned</option>
            </select>
            <button onClick={()=>{ setPage(1); fetchUsers(); }} className="px-4 py-2 rounded bg-blue-600 text-white">查詢</button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={()=>setShowCreateModal(true)} className="px-3 py-2 rounded bg-indigo-600 text-white flex items-center gap-2">
              <Icon icon="mdi:account-plus-outline" className="w-4 h-4" /> 新增帳號
            </button>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="file" accept=".csv" onChange={handleImportFile} className="hidden" />
              <span className="px-3 py-2 rounded bg-gray-100">匯入 CSV</span>
            </label>
            <button onClick={exportCSV} className="px-3 py-2 rounded bg-gray-100">匯出 CSV</button>
            <button onClick={()=>selectAllOnPage()} className="px-3 py-2 rounded bg-gray-100">全選（本頁）</button>
            <button onClick={()=>clearSelection()} className="px-3 py-2 rounded bg-gray-100">清除選取</button>
          </div>
        </div>

        {/* Selected toolbar */}
        {selected.size > 0 && (
          <div className="mt-3 bg-yellow-50 p-3 rounded flex items-center justify-between">
            <div>已選取 {selected.size} 個使用者</div>
            <div className="flex items-center gap-2">
              <button onClick={()=>batchAction("ban")} className="px-3 py-1 rounded bg-red-600 text-white">批次封禁</button>
              <button onClick={()=>batchAction("unban")} className="px-3 py-1 rounded bg-green-600 text-white">批次解封</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="mt-4 bg-white rounded shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="text-sm text-gray-600 bg-gray-50">
              <tr>
                <th className="p-3 text-left"><input type="checkbox" onChange={e=> e.target.checked ? selectAllOnPage() : clearSelection()} aria-label="全選" /></th>
                <th className="p-3 text-left">姓名</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">註冊日</th>
                <th className="p-3 text-left">狀態</th>
                <th className="p-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="p-6 text-center">載入中...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="6" className="p-6 text-center">查無資料</td></tr>
              ) : users.map(user => (
                <tr key={user.id} className="border-t">
                  <td className="p-3"><input type="checkbox" checked={selected.has(user.id)} onChange={()=>toggleSelect(user.id)} aria-label={`選取 ${user.name || user.email}`} /></td>
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3 text-sm text-gray-500">{user.created_at?.split('T')?.[0] || "-"}</td>
                  <td className="p-3">{user.status}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button onClick={()=>openEdit(user)} className="px-2 py-1 rounded bg-gray-100">編輯</button>
                      <button onClick={()=>toggleBan(user)} className="px-2 py-1 rounded bg-gray-100">{user.status === "active" ? "封禁" : "解封"}</button>
                      <button onClick={()=>{ window.open(`/admin/users/${user.id}`, "_blank") }} className="px-2 py-1 rounded bg-gray-100">檢視</button>
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
            <button onClick={()=>gotoPage(1)} disabled={page===1} className="px-3 py-1 rounded bg-gray-100">第一頁</button>
            <button onClick={()=>gotoPage(page-1)} disabled={page===1} className="px-3 py-1 rounded bg-gray-100">上一頁</button>
            <span className="px-2">第 {page} / {totalPages} 頁</span>
            <button onClick={()=>gotoPage(page+1)} disabled={page===totalPages} className="px-3 py-1 rounded bg-gray-100">下一頁</button>
            <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="px-2 py-1 border rounded">
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={()=>setShowEditModal(false)} />
            <div role="dialog" aria-modal="true" className="bg-white rounded-lg shadow p-6 z-10 w-[min(600px,95%)]">
              <h3 className="text-lg font-semibold">編輯使用者</h3>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <label className="flex flex-col">
                  <span className="text-sm text-gray-600">姓名</span>
                  <input value={editingUser.name || ""} onChange={e=>setEditingUser({...editingUser, name: e.target.value})} className="px-3 py-2 border rounded" />
                </label>
                <label className="flex flex-col">
                  <span className="text-sm text-gray-600">Email</span>
                  <input value={editingUser.email || ""} onChange={e=>setEditingUser({...editingUser, email: e.target.value})} className="px-3 py-2 border rounded" />
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editingUser.status !== "active"} onChange={e=>setEditingUser({...editingUser, status: e.target.checked ? "banned" : "active"})} />
                  <span className="text-sm">封禁此帳號</span>
                </label>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button onClick={()=>setShowEditModal(false)} className="px-4 py-2 rounded bg-gray-100">取消</button>
                <button onClick={saveEdit} className="px-4 py-2 rounded bg-blue-600 text-white">儲存</button>
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={()=>setShowCreateModal(false)} />
            <div role="dialog" aria-modal="true" className="bg-white rounded-lg shadow p-6 z-10 w-[min(600px,95%)]">
              <h3 className="text-lg font-semibold">新增帳號</h3>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <label className="flex flex-col">
                  <span className="text-sm text-gray-600">姓名</span>
                  <input value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} className="px-3 py-2 border rounded" />
                </label>

                <label className="flex flex-col">
                  <span className="text-sm text-gray-600">Email</span>
                  <input value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} className="px-3 py-2 border rounded" />
                </label>

                <label className="flex flex-col">
                  <span className="text-sm text-gray-600">密碼</span>
                  <input type="password" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="px-3 py-2 border rounded" />
                  <div className="text-xs text-gray-400 mt-1">密碼建議至少 6 碼。</div>
                </label>

                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={newUser.status !== "active"} onChange={e=>setNewUser({...newUser, status: e.target.checked ? "banned" : "active"})} />
                  <span className="text-sm">預設為封禁（勾選則為 banned）</span>
                </label>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button onClick={()=>setShowCreateModal(false)} className="px-4 py-2 rounded bg-gray-100">取消</button>
                <button onClick={createUser} className="px-4 py-2 rounded bg-indigo-600 text-white">建立帳號</button>
              </div>
            </div>
          </div>
        )}

        {error && <div className="mt-4 text-red-600">錯誤：{error}</div>}
      </div>
    </div>
  );
}
