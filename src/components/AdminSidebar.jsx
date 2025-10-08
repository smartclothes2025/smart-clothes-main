import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import '../App.css';

export default function AdminSidebar() {
  return (
    <aside className="left-sidebar bg-gray-100" >
       <div className="mt-6 flex-1 overflow-y-auto px-2">
	        <nav className="space-y-2">
            <Link to="/admin/Dashboard" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <Icon icon="mdi:view-dashboard-outline" className="w-5 h-5" />
              <span>後臺首頁</span>
            </Link>

            <Link to="/admin/Users" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <Icon icon="mdi:account-multiple-outline" className="w-5 h-5" />
              <span>帳號管理</span>
            </Link>

            <Link to="/admin/Users" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <Icon icon="mdi:hanger" className="w-5 h-5" />
              <span>衣櫃管理</span>
            </Link>

            <Link to="/admin/Settings" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <Icon icon="mdi:cog-outline" className="w-5 h-5" />
              <span>設定</span>
            </Link>

            <Link to="/home" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <Icon icon="mdi:account-circle-outline" className="w-5 h-5" />
              <span>使用者主頁</span>
            </Link>
          </nav>
        </div>
      
        <button onClick={() => { localStorage.removeItem("token"); window.location.href = "/"; }} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
          <Icon icon="mdi:logout" className="w-5 h-5" />
          <span>登出</span>
        </button>
      
    </aside>
  );
}
