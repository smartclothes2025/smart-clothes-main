// src/admin/Dashboard.jsx
import React from "react";
import Layout from "../components/Layout";

export default function AdminDashboard() {
  // 假資料示意
  const kpis = [
    { title: "使用者總數", value: "12,345" },
    { title: "當日活躍", value: "1,234" },
    { title: "新增衣物（7d）", value: "567" },
    { title: "推薦準確率", value: "86%" },
  ];

  const recentUsers = [
    { id: 1, name: "林小明", email: "lin@example.com", role: "user" },
    { id: 2, name: "王小美", email: "wang@example.com", role: "user" },
    { id: 3, name: "張管理", email: "admin@example.com", role: "admin" },
  ];

  return (
    <Layout title="後臺首頁">
      <div className="bankpage-wrapper bg-gray-100">
        {/* KPI 卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.title} className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">{k.title}</div>
              <div className="mt-2 text-2xl font-semibold">{k.value}</div>
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
            {/* 這裡放圖表（可用 recharts 或 chart.js） */}
            <div className="mt-4 h-56 rounded bg-gray-50 flex items-center justify-center text-gray-400">
              [折線圖 Placeholder]
            </div>
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
            </ul>
          </div>
        </div>

        {/* 快速動作 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-indigo-600 text-white rounded-lg py-3">建立促銷活動</button>
          <button className="bg-amber-500 text-white rounded-lg py-3">觸發模型重新訓練</button>
          <button className="bg-gray-100 rounded-lg py-3">匯出使用者資料</button>
        </div>
      </div>
    </Layout>
  );
}
