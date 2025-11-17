// src/admin/Users.jsx
import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import StyledButton from "../components/ui/StyledButton";
import Page from "../components/Page";
import AskModal from "../components/AskModal";
import fetchJSON from "../lib/api";

/**
 * 後台－帳號管理
 * 功能：
 * 1) 列表、搜尋、分頁、刪除（可選）
 * 2) 將「共 X 筆資料」寫入 localStorage: kpi:usersTotal，供儀表板讀取
 */
export default function AdminUsers() {
  const API_BASE = import.meta.env.VITE_API_BASE || ""; // e.g. /api/v1

  // === State ===
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usersRaw, setUsersRaw] = useState([]);

  // 篩選/分頁
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // 刪除確認
  const [askOpen, setAskOpen] = useState(false);
  const [askTargetId, setAskTargetId] = useState(null);

  // === 初始載入 ===
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 重新整理
  async function reload() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const url = new URL(`${API_BASE}/auth/users`);
      url.searchParams.set("limit", "1000");
      const data = await fetchJSON(url.toString(), { headers });
      setUsersRaw(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError(e?.message || "讀取失敗");
    } finally {
      setLoading(false);
    }
  }

  // === 正規化資料 ===
  const allUsers = useMemo(() => {
    const data = Array.isArray(usersRaw) ? usersRaw : [];
    return data.map((r, idx) => {
      const id = r.id ?? r.user_id ?? idx + 1;
      const display =
        r.display_name || r.username || r.name || r.email || String(id);
      const email = r.email || "";
      const role =
        r.role ||
        r.user_role ||
        (Array.isArray(r.roles) && r.roles.length ? r.roles.join(", ") : "user");
      const created_at = r.created_at ?? r.createdAt ?? r.created ?? null;

      return {
        id,
        display,
        email,
        role,
        created_at,
        raw: r,
      };
    });
  }, [usersRaw]);

  // === 客端篩選 ===
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rf = roleFilter.trim().toLowerCase();
    return allUsers.filter((u) => {
      const byQ =
        !q ||
        `${u.display || ""}`.toLowerCase().includes(q) ||
        `${u.email || ""}`.toLowerCase().includes(q);
      const byR = !rf || `${u.role || ""}`.toLowerCase().includes(rf);
      return byQ && byR;
    });
  }, [allUsers, query, roleFilter]);

  // === 寫入 KPI：共 X 筆資料 ===
  useEffect(() => {
    try {
      localStorage.setItem("kpi:usersTotal", String(filtered.length));
    } catch {}
  }, [filtered.length]);

  // === 分頁 ===
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function gotoPage(n) {
    setPage(Math.max(1, Math.min(totalPages, n)));
  }

  // === 刪除 ===
  async function handleDeleteUser(id) {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      setUsersRaw((cur) =>
        Array.isArray(cur)
          ? cur.filter((r) => String(r.id ?? r.user_id) !== String(id))
          : cur
      );

      const url = `${API_BASE}/auth/users/${id}`;
      await fetchJSON(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      await reload();
    } catch (err) {
      alert("刪除失敗：" + (err?.message || "未知錯誤"));
      await reload();
    } finally {
      setLoading(false);
    }
  }

  function openAskModal(id) {
    setAskTargetId(id);
    setAskOpen(true);
  }

  return (
    <div>
      <Layout title="帳號管理" />
      <div className="bankpage-wrapper bg-gray-100">
        {/* 篩選列 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              className="form-input w-64"
              placeholder="搜尋姓名或 Email"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />

            <input
              className="form-input w-44"
              placeholder="角色（關鍵字）"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            />

            <StyledButton onClick={reload}>重新載入</StyledButton>
          </div>
        </div>

        {/* 表格 */}
        <div className="mt-4 bg-white rounded-xl shadow ring-1 ring-black/5 overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="text-sm text-gray-700 bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-3 text-left w-[30%]">使用者</th>
                <th className="p-3 text-left w-[30%]">Email</th>
                <th className="p-3 text-left w-[20%]">角色</th>
                <th className="p-3 text-left w-[20%]">建立時間</th>
                <th className="p-3 text-left w-[10%]">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && allUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center">
                    載入中…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-rose-600">
                    {error}
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center">
                    查無資料
                  </td>
                </tr>
              ) : (
                pageItems.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t odd:bg-white even:bg-gray-50"
                  >
                    <td className="p-3 truncate">{u.display}</td>
                    <td className="p-3 truncate">{u.email || "-"}</td>
                    <td className="p-3">{u.role}</td>
                    <td className="p-3 text-sm text-gray-500">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleString("zh-TW", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => openAskModal(u.id)}
                        className="px-2 py-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分頁／總筆數 */}
        <Page
          page={page}
          totalPages={totalPages}
          gotoPage={gotoPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          total={filtered.length}
        />

        {/* 刪除確認 */}
        <AskModal
          open={askOpen}
          title="刪除帳號"
          message="確定要刪除此帳號？此操作無法復原。"
          confirmText="刪除"
          cancelText="取消"
          destructive
          onCancel={() => {
            setAskOpen(false);
            setAskTargetId(null);
          }}
          onConfirm={() => {
            if (askTargetId) handleDeleteUser(askTargetId);
            setAskOpen(false);
            setAskTargetId(null);
          }}
        />
      </div>
    </div>
  );
}
