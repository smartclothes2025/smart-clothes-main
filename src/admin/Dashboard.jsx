// src/admin/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import useAllClothes from "../hooks/useAllClothes";
import Layout from "../components/Layout";
// ✅ 引入 Recharts 元件
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from "recharts";

// ---- KPI 快取 key（統一管理，避免拼錯）----
const KPI_KEYS = {
  users: "kpi:usersTotal",
  clothes: "kpi:clothesTotal",
  posts: "kpi:postsTotal",
  outfits: "kpi:outfitsTotal",
};

// ✅ 為圓餅圖定義顏色組
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF5733'];

// 讀取快取並轉成數字
function readInt(key, fallback = 0) {
  const v = localStorage.getItem(key);
  const n = v == null ? NaN : parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export default function AdminDashboard() {
  const API_BASE = import.meta.env.VITE_API_BASE || "";

  // ✅ 這裡改成抓全站：與 AdminClothes 一致
  const { allItems, loading: clothesLoading } = useAllClothes({ scope: "all" });

  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]); // 若沒有 /posts 也會容錯
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ 啟動就讀快取（含舊 key 相容：kpi:poststotal）
  const [localKpi, setLocalKpi] = useState({
    users: readInt(KPI_KEYS.users, 0),
    clothes: readInt(KPI_KEYS.clothes, 0),
    posts: (() => {
      const v = localStorage.getItem(KPI_KEYS.posts) ?? localStorage.getItem("kpi:poststotal");
      return v ? parseInt(v, 10) : 0;
    })(),
    outfits: readInt(KPI_KEYS.outfits, 0),
  });

  // ✅ 第一次載入 API（只抓一次，不重覆）
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        // /posts 可能不存在；且加上 scope=all 取全站
        const [u, p, o] = await Promise.all([
          fetch(`${API_BASE}/users?limit=1000`, { headers }),
          fetch(`${API_BASE}/posts?limit=1000&scope=all`, { headers }).catch(() => null),
          fetch(`${API_BASE}/outfits?limit=1000&scope=all`, { headers }),
        ]);

        if (!u.ok || !o.ok) throw new Error("API 讀取失敗");

        const [usersJson, postsJsonMaybe, outfitsJson] = await Promise.all([
          u.json(),
          p && p.ok ? p.json() : Promise.resolve([]),
          o.json(),
        ]);

        if (!mounted) return;

        const usersArr = Array.isArray(usersJson) ? usersJson : [];
        const postsArr = Array.isArray(postsJsonMaybe) ? postsJsonMaybe : [];
        const outfitsArr = Array.isArray(outfitsJson) ? outfitsJson : [];

        setUsers(usersArr);
        setPosts(postsArr);
        setOutfits(outfitsArr);

        // ✅ 寫回快取前「比大小」，避免小數覆蓋大數
        const writes = [
          { key: KPI_KEYS.users, val: usersArr.length },
          { key: KPI_KEYS.clothes, val: allItems.length }, // 已是 scope=all
          { key: KPI_KEYS.posts, val: postsArr.length },
          { key: KPI_KEYS.outfits, val: outfitsArr.length },
        ];
        writes.forEach(({ key, val }) => {
          if (val > 0) {
            const prev = readInt(key, 0);
            if (val > prev) localStorage.setItem(key, String(val));
          }
        });

        // 同步 localKpi（也採用較大值）
        setLocalKpi((prev) => ({
          users: Math.max(prev.users, usersArr.length),
          clothes: Math.max(prev.clothes, allItems.length),
          posts: Math.max(prev.posts, postsArr.length),
          outfits: Math.max(prev.outfits, outfitsArr.length),
        }));
      } catch (e) {
        console.error(e);
        if (mounted) setError(e?.message || "讀取失敗");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
    // 🚫 不把 allItems 放進依賴，避免 hook 更新導致重抓
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE]);

  // ✅ 即時資料
  const liveCounts = {
    users: users?.length || 0,
    clothes: allItems?.length || 0, // scope=all
    posts: posts?.length || 0,
    outfits: outfits?.length || 0,
  };

  // ✅ 顯示值採「max(live, cache)」，避免小的 live 蓋掉大的全站快取
  const displayCounts = {
    users: Math.max(liveCounts.users, localKpi.users || 0),
    clothes: Math.max(liveCounts.clothes, localKpi.clothes || 0),
    posts: Math.max(liveCounts.posts, localKpi.posts || 0),
    outfits: Math.max(liveCounts.outfits, localKpi.outfits || 0),
  };

  // ✅ 若之後資料才補齊：回寫快取前一樣「比大小」
  useEffect(() => {
    const entries = [
      { key: KPI_KEYS.users, val: liveCounts.users },
      { key: KPI_KEYS.clothes, val: liveCounts.clothes },
      { key: KPI_KEYS.posts, val: liveCounts.posts },
      { key: KPI_KEYS.outfits, val: liveCounts.outfits },
    ];
    entries.forEach(({ key, val }) => {
      if (val > 0) {
        const prev = readInt(key, 0);
        if (val > prev) localStorage.setItem(key, String(val));
      }
    });
  }, [liveCounts.users, liveCounts.clothes, liveCounts.posts, liveCounts.outfits]);

  // ✅ KPI 卡片資料 (新增 icon 和 color 屬性)
  const kpis = useMemo(() => {
    return [
      {
        title: "使用者總數",
        value: displayCounts.users.toLocaleString(),
        icon: "👥",
        color: "bg-blue-500",
        ring: "ring-blue-300",
      },
      {
        title: "衣物總數",
        value: `${displayCounts.clothes.toLocaleString()} 件`,
        icon: "👚",
        color: "bg-green-500",
        ring: "ring-green-300",
      },
      {
        title: "貼文總數",
        value: displayCounts.posts.toLocaleString(),
        icon: "📰",
        color: "bg-yellow-500",
        ring: "ring-yellow-300",
      },
      {
        title: "穿搭總數",
        value: displayCounts.outfits.toLocaleString(),
        icon: "👗",
        color: "bg-indigo-500",
        ring: "ring-indigo-300",
      },
    ];
  }, [displayCounts.users, displayCounts.clothes, displayCounts.posts, displayCounts.outfits]);

  // ======== 衣物「類別分佈」：以 PieChart 呈現 ========
  const categoryDist = useMemo(() => {
    const map = new Map();
    (allItems || []).forEach((it) => {
      const key = (it?.category || it?.category_name || "其他").toString();
      map.set(key, (map.get(key) || 0) + 1);
    });
    const total = (allItems || []).length || 0;
    const rows = [...map.entries()]
      .map(([name, count]) => ({
        name,
        count,
        pct: total ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
    return { total, rows };
  }, [allItems]);

  // ======== 活躍使用者 TOP5（以上傳衣物數） ========
  const topUploaders = useMemo(() => {
    const byUser = new Map();
    (allItems || []).forEach((it) => {
      const uid = it?.user_id ?? it?.owner_id ?? "unknown";
      byUser.set(uid, (byUser.get(uid) || 0) + 1);
    });
    const merged = [...byUser.entries()].map(([uid, count]) => {
      const u = (users || []).find((x) => String(x.id) === String(uid));
      const name = u?.username || u?.display_name || u?.email || `user-${uid}`;
      const email = u?.email || "";
      return { uid, name, email, count };
    });
    return merged.sort((a, b) => b.count - a.count).slice(0, 5);
  }, [allItems, users]);

  // ======== 最近上傳（依 created_at 排序） ========
  const recentClothes = useMemo(() => {
    const arr = Array.isArray(allItems) ? [...allItems] : [];
    arr.sort((a, b) =>
      String(b.created_at || "").localeCompare(String(a.created_at || ""))
    );
    return arr.slice(0, 6).map((it) => ({
      id: it.id,
      name: it.name || it.title || "未命名",
      category: it.category || it.category_name || "其他",
      created_at: it.created_at,
    }));
  }, [allItems]);

  // ======== 近期註冊（右側列表） ========
  const recentUsers = useMemo(() => {
    const arr = Array.isArray(users) ? [...users] : [];
    arr.sort((a, b) =>
      String(b.created_at || "").localeCompare(String(a.created_at || ""))
    );
    return arr.slice(0, 5).map((u) => ({
      id: u.id,
      name: u.username || u.email || `user-${u.id}`,
      email: u.email || "",
      role: u.role || "user",
    }));
  }, [users]);

  return (
    <Layout title="後台首頁">
      <div className="bankpage-wrapper bg-gray-100">
        {/* KPI 卡片 (優化樣式) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div
              key={k.title}
              className="bg-white rounded-xl shadow-lg p-5 transition hover:shadow-2xl" // 新增陰影和圓角
            >
              <div className="flex items-center justify-between">
                {/* 圖標區 */}
                <div className={`w-10 h-10 flex items-center justify-center rounded-full ${k.color} text-white ring-4 ${k.ring} bg-opacity-100`}>
                  {k.icon}
                </div>
                {/* 數值區 */}
                <div className="text-xl font-bold text-gray-800 ml-4">
                  {loading && !displayCounts ? "-" : k.value}
                </div>
              </div>
              <div className="mt-3 text-sm font-medium text-gray-500">{k.title}</div>
            </div>
          ))}
        </div>

        {/* 第一排：類別分佈（圖表替換） + 近期註冊 */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 🎨 衣物類別分佈 (Pie Chart) */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4 h-[400px]">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="font-semibold text-lg">衣物類別分佈</h2>
              <div className="text-sm text-gray-500">
                總數：{categoryDist.total.toLocaleString()} 件
              </div>
            </div>

            {categoryDist.total === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">尚無資料可供分析</div>
            ) : (
              <div className="flex flex-col lg:flex-row h-[calc(100%-48px)]">
                {/* 圓餅圖 (佔 1/2 寬度) */}
                <div className="w-full lg:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDist.rows}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="#8884d8"
                        labelLine={false}
                      >
                        {categoryDist.rows.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        // 自定義提示格式：顯示件數和百分比
                        formatter={(value, name, props) => [`${value} 件 (${props.payload.pct}%)`, props.payload.name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* 圖例 (佔 1/2 寬度) */}
                <div className="w-full lg:w-1/2 mt-6 lg:mt-0 lg:pl-6 overflow-y-auto max-h-[300px]">
                  {categoryDist.rows.slice(0, 5).map((row, index) => ( // 只顯示 Top 5 類別
                    <div key={row.name} className="flex items-center justify-between mb-2 p-1 rounded hover:bg-gray-50 transition">
                      <div className="flex items-center">
                        <span
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-gray-700 font-medium text-sm">{row.name}</span>
                      </div>
                      <span className="text-gray-600 text-sm font-medium">{row.pct}% <span className="text-gray-400">({row.count})</span></span>
                    </div>
                  ))}
                  {categoryDist.rows.length > 5 && (
                    <div className="text-xs text-gray-400 mt-2 text-right">... 還有 {categoryDist.rows.length - 5} 個類別</div>
                  )}
                </div>
              </div>
            )}

            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>

          {/* 近期註冊 */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h2 className="font-semibold text-lg border-b pb-3">近期註冊</h2>
            <ul className="mt-4 space-y-3">
              {recentUsers.length === 0 && (
                <li className="text-sm text-gray-500">無資料</li>
              )}
              {recentUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between p-1 rounded hover:bg-gray-50 transition">
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-sm text-gray-500">{u.email}</div>
                  </div>
                  <div className="text-xs text-gray-400 capitalize">{u.role}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 第二排：活躍使用者 TOP5 + 最近上傳 (優化樣式) */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 活躍使用者 TOP5 */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h2 className="font-semibold text-lg border-b pb-3">活躍使用者 TOP5（以上傳件數）</h2>
            <ol className="mt-4 space-y-3 list-decimal list-inside">
              {topUploaders.length === 0 && (
                <li className="text-sm text-gray-500 list-none pl-6">尚無資料</li>
              )}
              {topUploaders.map((u) => (
                <li key={u.uid} className="flex items-center justify-between p-1 rounded hover:bg-gray-50 transition">
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-sm text-gray-500">{u.email}</div>
                  </div>
                  <div className="text-sm font-bold text-indigo-600">{u.count} 件</div>
                </li>
              ))}
            </ol>
          </div>

          {/* 最近上傳 */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4">
            <h2 className="font-semibold text-lg border-b pb-3">最近上傳</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3"> {/* 增加為 3 欄 */}
              {recentClothes.length === 0 && (
                <div className="text-sm text-gray-500">尚無資料</div>
              )}
              {recentClothes.map((it) => (
                <div
                  key={it.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-indigo-50 hover:border-indigo-300 transition text-left"
                >
                  <div className="text-sm font-semibold text-gray-800 truncate" title={it.name || ""}>
                    {it.name}
                  </div>
                  <div className="text-xs text-indigo-500 mt-1">
                    類別：{String(it.category)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {it.created_at
                      ? String(it.created_at).replace("T", " ").slice(0, 16)
                      : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}