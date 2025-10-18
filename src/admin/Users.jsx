// src/admin/Users.jsx
import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import StyledButton from "../components/ui/StyledButton";
import Page from "../components/Page";
import { Icon } from "@iconify/react";
import "../assets/TableStyles.css";
export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [loading, setLoading] = useState(false);

  // modal state: edit & create
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", status: "active" });

  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE || ""; // 例如 http://localhost:8000/api/v1

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, statusFilter, page, pageSize]);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
  // 改從後端 auth 模組提供的清單 API 取資料（/api/v1/auth/users）
  const url = new URL(`${API_BASE}/auth/users`);
      url.searchParams.set("limit", "1000");
      const token = localStorage.getItem("token");
      const res = await fetch(url.toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("取得使用者列表失敗");
      const data = await res.json(); // 後端回傳為陣列
      const normalized = Array.isArray(data)
        ? data.map((u) => ({
            id: u.id,
            name: u.display_name || u.username || u.name || u.email || "",
            email: u.email || "",
            status: "active", // 後端尚未提供狀態欄位
            role: u.role || "user",
            created_at: u.created_at || u.createdAt || null,
          }))
        : [];
      setUsers(normalized);
    } catch (err) {
      console.error(err);
      setError(err.message || "取得列表失敗");
    } finally {
      setLoading(false);
    }
  }

  // selection 與編輯暫不提供

  async function handleDelete(id) {
    if (!confirm("確定要刪除此帳號？此操作無法復原。")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/auth/users/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "刪除失敗");
      }
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert(err.message || "刪除失敗");
    }
  }

  // Create user
  function validateEmail(e) {
    return /\S+@\S+\.\S+/.test(e);
  }
  async function createUser() {
    // 以目前後端 /auth/register 的表單版為主（email、password、display_name）
    if (!validateEmail(newUser.email)) return alert("請輸入有效 Email");
    if (!newUser.name?.trim()) return alert("請輸入姓名");
    if (!newUser.password || newUser.password.length < 6) return alert("密碼至少 6 碼");

    try {
      const form = new FormData();
      form.set("email", newUser.email);
      form.set("password", newUser.password);
      form.set("display_name", newUser.name);
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "建立帳號失敗");
      }
      alert("建立成功");
      setShowCreateModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.message || "建立帳號失敗");
    }
  }

  // 批次操作暫不提供

  // CSV export/import placeholders (keep as-is)
  function exportCSV() { alert("目前為唯讀模式，暫不支援匯出。"); }
  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    alert("目前為唯讀模式，暫不支援匯入。");
    e.target.value = null;
  }

  // pagination
  // client-side 篩選與分頁
  const filtered = useMemo(() => {
    let arr = users;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      arr = arr.filter((u) =>
        (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      arr = arr.filter((u) => (u.status || "active") === statusFilter);
    }
    return arr;
  }, [users, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);
  function gotoPage(n) { setPage(Math.max(1, Math.min(totalPages, n))); }

  return (
    <div>
      <Layout title="帳號管理" />
      <div className="h-100vh  bg-gray-100">
      <div className="bankpage-wrapper">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              aria-label="搜尋使用者"
              placeholder="搜尋姓名或 Email"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="form-input w-56"
              onKeyDown={(e)=>{ if(e.key==='Enter'){ setPage(1); fetchUsers(); }}}
            />
            <StyledButton onClick={()=>setShowCreateModal(true)} className="flex items-center gap-2">
              <Icon icon="mdi:account-plus-outline" className="w-4 h-4" /> 新增帳號
            </StyledButton>
          </div>

          <div className="flex items-center gap-2">
            <StyledButton onClick={exportCSV} className="flex items-center gap-2">
              <Icon icon="mdi:file-export-outline" className="w-4 h-4" /> 匯出 CSV
            </StyledButton>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-xl shadow ring-1 ring-black/5 overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="text-sm text-gray-700 bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-3 text-left w-[20%]">姓名</th>
                <th className="p-3 text-left w-[25%]">Email</th>
                <th className="p-3 text-left w-[20%]">註冊日</th>
                <th className="p-3 text-left w-[15%]">狀態</th>
                <th className="p-3 text-left w-[20%]">操作</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                if (loading) {
                  return (<tr><td colSpan="5" className="p-6 text-center">載入中...</td></tr>);
                }
                if (filtered.length === 0) {
                  return (<tr><td colSpan="5" className="p-6 text-center">查無資料</td></tr>);
                }
                return pageItems.map(user => (
                  <tr key={user.id} className="border-t odd:bg-white even:bg-gray-50">
                    <td className="p-3 truncate">{user.name}</td>
                    <td className="p-3 truncate">{user.email}</td>
                    <td className="p-3 text-sm text-gray-500">{(user.created_at ? new Date(user.created_at).toLocaleDateString() : "-")}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${user.status === 'active' ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' : 'bg-red-50 text-red-700 ring-1 ring-red-600/20'}`}>{user.status}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button onClick={()=>{ window.open(`/admin/users/${user.id}`, "_blank") }} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">檢視</button>
                        <button onClick={()=>handleDelete(user.id)} className="px-2 py-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100">刪除</button>
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

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              onClick={()=>setShowCreateModal(false)}
              aria-label="關閉建立帳號視窗"
            />
            <dialog open className="bg-white rounded-lg shadow p-6 z-10 w-[min(600px,95%)]">
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
            </dialog>
          </div>
        )}

        {error && <div className="mt-4 text-red-600">錯誤：{error}</div>}
      </div>
      </div>
    </div>
  );
}
