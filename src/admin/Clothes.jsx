// src/admin/Clothes.jsx
import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import StyledButton from "../components/ui/StyledButton";
import Page from "../components/Page";
import { Icon } from "@iconify/react";
import "../assets/TableStyles.css";
import AskModal from "../components/AskModal";
import useAllClothes from "../hooks/useAllClothes"; // 引入 SWR Hook
import fetchJSON from "../lib/api"; // 引入 SWR Fetcher

export default function AdminClothes() {
  const [users, setUsers] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const API_BASE = import.meta.env.VITE_API_BASE || ""; // e.g. /api/v1
  const SERVER_ORIGIN = useMemo(
    () => (API_BASE || "").replace(/\/api\/v1\/?$/, ""),
    [API_BASE]
  );

  // 🚨 修正: 傳遞 { scope: 'all' } 確保管理員視圖獲取所有衣物
  const { allItems: allRawItems, loading: clothesLoading, error: clothesError, mutate } = useAllClothes({ scope: 'all' });

  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const [askOpen, setAskOpen] = useState(false);
  const [askTargetId, setAskTargetId] = useState(null);

  useEffect(() => {
    // 僅在第一次載入時獲取使用者資料
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = new URL(`${API_BASE}/auth/users`);
      url.searchParams.set("limit", "1000");

      const data = await fetchJSON(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!Array.isArray(data)) return;
      setUsers(data);
      const map = {};
      data.forEach((u) => {
        if (u?.id !== undefined)
          map[String(u.id)] =
            u.display_name || u.username || u.name || u.email || String(u.id);
      });
      setUsersMap(map);
      return map;
    } catch (err) {
      console.warn("fetchUsers failed", err);
    } finally {
      setLoading(false);
    }
  }

  // 🚨 優化: 正規化邏輯 - 使用 useMemo 結合 SWR 獲取的原始數據
  const allItems = useMemo(() => {
    if (clothesLoading || clothesError) return [];

    const usersMapLocal = usersMap;
    const normalized = (ArrayOfRawItems(allRawItems)).map((r, idx) => {
      const id = r.id ?? r.clothes_id ?? idx + 1;
      const name = r.name ?? r.title ?? r.filename ?? r.image ?? "未命名";
      const category = r.category ?? r.type ?? r.category_name ?? "未分類";
      let last_worn_at =
        r.last_worn_at ??
        r.lastWornAt ??
        r.last_worn ??
        null;

      // ... (日期轉換邏輯) ...
      try {
        if (last_worn_at) {
          const d = new Date(last_worn_at);
          last_worn_at = isNaN(d.getTime()) ? null : d.toISOString();
        }
      } catch {
        last_worn_at = null;
      }

      const uid =
        r.user_id ?? r.owner ?? r.user ?? r.userId ?? r.owner_id ?? null;
      let user_display =
        (uid && usersMapLocal[String(uid)])
          ? usersMapLocal[String(uid)]
          : r.owner_display_name ||
          r.user_display_name ||
          r.user_name ||
          (uid ? String(uid) : "-");

      // 圖片邏輯
      const filename =
        r.filename ??
        r.image ??
        r.img ??
        r.cover_image ??
        r.cover_image_url ??
        "";
      let image_url = "";
      if (filename) {
        if (typeof filename === "string" && (filename.startsWith("http://") || filename.startsWith("https://"))) {
          image_url = filename;
        } else if (typeof filename === "string" && filename.startsWith("/")) {
          image_url = `${API_BASE.replace(/\/$/, "")}${filename}`;
        } else if (r.img || r.cover_url) {
          image_url = r.img || r.cover_url;
        } else {
          image_url = `${SERVER_ORIGIN.replace(
            /\/$/,
            ""
          )}/uploads/${filename}`;
        }
      }

      return {
        id,
        name,
        category,
        last_worn_at,
        user_display,
        image_url,
        raw: r,
      };
    });

    return normalized;
  }, [allRawItems, usersMap, clothesLoading, clothesError, API_BASE, SERVER_ORIGIN]);

  // 輔助函數：確保 allRawItems 是陣列
  function ArrayOfRawItems(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.initialItems)) return data.initialItems;
    return [];
  }


  // 客端篩選 (保持不變)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const uf = userFilter.trim().toLowerCase();
    return allItems.filter((it) => {
      const byQ =
        !q ||
        `${it.name || ""}`.toLowerCase().includes(q) ||
        `${it.user_display || ""}`.toLowerCase().includes(q);
      const byU = !uf || `${it.user_display || ""}`.toLowerCase().includes(uf);
      const byC =
        !categoryFilter ||
        `${it.category || ""}`
          .toLowerCase()
          .includes(categoryFilter.toLowerCase());
      return byQ && byU && byC;
    });
  }, [allItems, query, userFilter, categoryFilter]);

  // ［新增］把「共 X 筆資料」寫進 localStorage，給儀表板使用
  useEffect(() => {
    try {
      localStorage.setItem("kpi:clothesTotal", String(filtered.length));
    } catch {}
  }, [filtered.length]);

  // 分頁 (保持不變)
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function gotoPage(n) {
    setPage(Math.max(1, Math.min(totalPages, n)));
  }

  // 🚨 優化: 刪除邏輯使用 SWR mutate + Optimistic Update
  async function handleDeleteClothes(id) {
    setLoading(true);
    const token = localStorage.getItem("token");

    // ✅ 在 SWR 的「raw 快取」上做函式型 mutate，維持相同資料形狀
    mutate((currentRaw) => {
      if (!currentRaw) return currentRaw;

      // 兼容多種後端欄位命名，必要時用 index 後援
      const isNotTarget = (r, idx) => {
        const rid =
          r?.id ??
          r?.clothes_id ??
          r?.raw_id ??
          r?.cloth_id ??
          (r?.raw?.id) ??
          (idx + 1);
        return String(rid) !== String(id);
      };

      // 支援兩種形狀：純陣列 或 { initialItems: [...] }
      if (Array.isArray(currentRaw)) {
        return currentRaw.filter(isNotTarget);
      }
      if (Array.isArray(currentRaw.initialItems)) {
        return { ...currentRaw, initialItems: currentRaw.initialItems.filter(isNotTarget) };
      }
      return currentRaw;
    }, { revalidate: false });

    try {
      const url = `${API_BASE}/clothes/${id}`;
      await fetchJSON(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      // 成功後再拉一次後端，確保一致
      mutate();
    } catch (err) {
      alert("刪除失敗：" + (err?.message || "未知錯誤"));
      // 回滾：重新取得正確資料
      mutate();
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
      <Layout title="衣櫃管理" />
      <div className="bankpage-wrapper bg-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              className="form-input w-56"
              placeholder="搜尋衣物或使用者"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="form-select-custom w-56"
            >
              <option value="">所有分類</option>
              {/* 使用已經正規化的 allItems 來獲取分類列表 */}
              {Array.from(
                new Set(allItems.map((it) => it.category).filter(Boolean))
              ).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <StyledButton onClick={() => mutate()}> {/* 🚨 優化: 點擊按鈕手動觸發 SWR 重新驗證 */}
              重新載入
            </StyledButton>
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
                <th className="p-3 text-left w-[20%]">最後穿著時間</th>
                <th className="p-3 text-left w-[10%]">操作</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // 🚨 狀態合併判斷
                if (clothesLoading && allItems.length === 0) {
                  return (
                    <tr>
                      <td colSpan="6" className="p-6 text-center">
                        載入中...
                      </td>
                    </tr>
                  );
                }
                if (clothesError) {
                  return (
                    <tr>
                      <td
                        colSpan="6"
                        className="p-6 text-center text-red-600"
                      >
                        {clothesError}
                      </td>
                    </tr>
                  );
                }
                if (pageItems.length === 0) {
                  return (
                    <tr>
                      <td colSpan="6" className="p-6 text-center">
                        查無資料
                      </td>
                    </tr>
                  );
                }
                return pageItems.map((item) => (
                  <tr key={item.id} className="border-t odd:bg-white even:bg-gray-50">
                    <td className="p-3">
                      <img
                        src={item.image_url || "/images/placeholder-96.png"}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "/images/placeholder-96.png";
                        }}
                      />
                    </td>
                    <td className="p-3 truncate">{item.user_display}</td>
                    <td className="p-3 truncate">{item.name}</td>
                    <td className="p-3">{item.category}</td>
                    <td className="p-3 text-sm text-gray-500">
                      {item.last_worn_at
                        ? new Date(item.last_worn_at).toLocaleString("zh-TW", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                        : "從未穿著"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openAskModal(item.id)}
                          className="px-2 py-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100"
                        >
                          刪除
                        </button>
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

        <AskModal
          open={askOpen}
          title="刪除衣物"
          message="確定要刪除此衣物？此操作無法復原。"
          confirmText="刪除"
          cancelText="取消"
          destructive={true}
          onCancel={() => {
            setAskOpen(false);
            setAskTargetId(null);
          }}
          onConfirm={() => {
            if (askTargetId) handleDeleteClothes(askTargetId);
            setAskOpen(false);
            setAskTargetId(null);
          }}
        />
      </div>
    </div>
  );
}
