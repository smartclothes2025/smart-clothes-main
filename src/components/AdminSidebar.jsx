import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import '../App.css';
export default function AdminSidebar() {
  const [open, setOpen] = useState(false);
  return (
      <aside className="left-sidebar">
        <div className="mt-6 flex-1 overflow-y-auto px-2">
          <nav className="space-y-2">
            <Link to="/admin/Dashboard" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <Icon icon="mdi:home-outline" className="w-5 h-5" />
              <span>後臺首頁</span>
            </Link>
            <Link to="/admin/Users" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <Icon icon="mdi:wardrobe-outline" className="w-5 h-5" />
              <span>帳號管理</span>
            </Link>
           <Link to="/upload/select" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <Icon icon="mdi:plus-circle-outline" className="w-5 h-5" />
              <span>衣櫃管理</span>
            </Link>
            <Link to="/post" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <Icon icon="mdi:plus-circle-outline" className="w-5 h-5" />
              <span>貼文管理</span>
            </Link>
            <Link to="/admin/Settings" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <Icon icon="mdi:account-circle-outline" className="w-5 h-5" />
              <span>設定</span>
            </Link>
          </nav>
        </div>
      </aside>
  );
}
