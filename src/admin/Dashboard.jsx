// src/admin/Dashboard.jsx（以 /api/v1 端點取得 KPI 與近期使用者）
import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";

export default function AdminDashboard() {
  const API_BASE = import.meta.env.VITE_API_BASE || "";

  const [users, setUsers] = useState([]);
  const [clothes, setClothes] = useState([]);
  const [posts, setPosts] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true); setError("");
      try {
        const token = localStorage.getItem("token");
        const headers = {
          "Accept": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const [u, c, p, o] = await Promise.all([
          fetch(`${API_BASE}/users?limit=1000`, { headers }),
          fetch(`${API_BASE}/clothes?limit=1000`, { headers }),
          fetch(`${API_BASE}/posts?limit=1000`, { headers }),
          fetch(`${API_BASE}/outfits?limit=1000`, { headers }),
        ]);
        if (!u.ok || !c.ok || !p.ok || !o.ok) throw new Error("API 讀取失敗");
        const [usersJson, clothesJson, postsJson, outfitsJson] = await Promise.all([
          u.json(), c.json(), p.json(), o.json()
        ]);
        if (!mounted) return;
        setUsers(Array.isArray(usersJson) ? usersJson : []);
        setClothes(Array.isArray(clothesJson) ? clothesJson : []);
        setPosts(Array.isArray(postsJson) ? postsJson : []);
        setOutfits(Array.isArray(outfitsJson) ? outfitsJson : []);
      } catch (e) {
        console.error(e);
        if (mounted) setError(e?.message || "讀取失敗");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [API_BASE]);

  const kpis = useMemo(() => ([
    { title: "使用者總數", value: users.length.toLocaleString() },
    { title: "衣物總數", value: clothes.length.toLocaleString() },
    { title: "貼文總數", value: posts.length.toLocaleString() },
    { title: "穿搭總數", value: outfits.length.toLocaleString() },
  ]), [users.length, clothes.length, posts.length, outfits.length]);

  const recentUsers = useMemo(() => {
    const arr = Array.isArray(users) ? users.slice() : [];
    // 若有 created_at 可排序，否則取前 5 筆
    arr.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
    return arr.slice(0, 5).map(u => ({
      id: u.id,
      name: u.username || u.email || `user-${u.id}`,
      email: u.email || "",
      role: u.role || "user",
    }));
  }, [users]);

  return (
    <Layout title="後台首頁">
      <div className="bankpage-wrapper bg-gray-100">
        {/* KPI 卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.title} className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">{k.title}</div>
              <div className="mt-2 text-2xl font-semibold">{loading ? "-" : k.value}</div>
            </div>
          ))}
        </div>

        {/* 主要面板 */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-4 min-h-[300px]">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">使用趨勢</h2>
              <div className="text-sm text-gray-500">最近 30 天</div>
            </div>
            <div className="mt-4 h-56 rounded bg-gray-50 flex items-center justify-center text-gray-400">
              {loading ? "載入中..." : "[折線圖 Placeholder]"}
            </div>
            {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold">近期註冊</h2>
            <ul className="mt-4 space-y-3">
              {recentUsers.map(u => (
                <li key={u.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-sm text-gray-500">{u.email}</div>
                  </div>
                  <div className="text-xs text-gray-400">{u.role}</div>
                </li>
              ))}
              {recentUsers.length === 0 && (
                <li className="text-sm text-gray-500">無資料</li>
              )}
            </ul>
          </div>
        </div>

        {/* 快速動作（純 UI） */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-indigo-600 text-white rounded-lg py-3">建立促銷活動</button>
          <button className="bg-amber-500 text-white rounded-lg py-3">觸發模型重新訓練</button>
          <button className="bg-gray-100 rounded-lg py-3">匯出使用者資料</button>
        </div>
      </div>
    </Layout>
  );
}
