// src/admin/Users.jsx
import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import StyledButton from "../components/ui/StyledButton";
import Page from "../components/Page";
import { Icon } from "@iconify/react";
import "../assets/TableStyles.css";
import CreateUserModal from "./CreateUserModal";
import AskModal from "../components/AskModal";
import { useToast } from '../components/ToastProvider';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  // modal state: edit & create
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", status: "active" });

  const [error, setError] = useState(null);
  const [askOpen, setAskOpen] = useState(false);
  const [askTargetId, setAskTargetId] = useState(null);

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
    } finally {
      setAskOpen(false);
      setAskTargetId(null);
    }
  }

  function openAskModal(id) {
    setAskTargetId(id);
    setAskOpen(true);
  }

  function validateEmail(e) {
    return /\S+@\S+\.\S+/.test(e);
  }

  async function createUser() {
    if (!validateEmail(newUser.email)) {
      toast.addToast && toast.addToast({ type: 'error', title: 'Email 無效' });
      return Promise.reject(new Error("Email 無效"));
    }
    if (!newUser.name?.trim()) {
      toast.addToast && toast.addToast({ type: 'error', title: '姓名無效' });
      return Promise.reject(new Error("姓名無效"));
    }
    if (!newUser.password || newUser.password.length < 6) {
      toast.addToast && toast.addToast({ type: 'error', title: '密碼無效' });
      return Promise.reject(new Error("密碼無效"));
    }

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
      fetchUsers();
    } catch (err) {
      alert(err.message || "建立帳號失敗");
      throw err;
    }
  }


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
                onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetchUsers(); } }}
              />
              <StyledButton onClick={() => setShowCreateModal(true)} variant="success">
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
                          <button onClick={() => { window.open(`/admin/users/${user.id}`, "_blank") }} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">檢視</button>
                          <StyledButton onClick={() => openAskModal(user.id)} variant="destructive">
                            刪除
                          </StyledButton>
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

          {/* [!!] 改為呼叫新的 Modal 元件 */}
          {showCreateModal && (
            <CreateUserModal
              setShowCreateModal={setShowCreateModal}
              createUser={createUser}
              newUser={newUser}
              setNewUser={setNewUser}
            />
          )}

          <AskModal
            open={askOpen}
            title="刪除帳號"
            message="確定要刪除此帳號？此操作無法復原。"
            confirmText="刪除"
            cancelText="取消"
            destructive={true}
            onCancel={() => { setAskOpen(false); setAskTargetId(null); }}
            onConfirm={() => { if (askTargetId) handleDelete(askTargetId); }}
          />

          {error && <div className="mt-4 text-red-600">錯誤：{error}</div>}
        </div>
      </div>
    </div>
  );
}
