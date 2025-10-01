// src/components/BottomNav.jsx
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";

export default function BottomNav() {
  return (
    <>
      {/* Mobile bottom nav - hidden on md+ */}
      <nav className="fixed bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-lg z-40 md:hidden">
        <div className="max-w-3xl mx-auto flex justify-between items-center px-6 py-3">
          <Link
            to="/"
            className="flex flex-col items-center text-sm text-gray-700 hover:text-blue-600"
            aria-label="首頁"
          >
            <Icon icon="mdi:home-outline" className="w-6 h-6" />
            <span className="text-xs">首頁</span>
          </Link>

          <Link
            to="/wardrobe"
            className="flex flex-col items-center text-sm text-gray-700 hover:text-blue-600"
            aria-label="智慧衣櫃"
          >
            {/* 衣櫃 / 衣架 你可二擇一 */}
            <Icon icon="mdi:wardrobe-outline" className="w-6 h-6" />
            {/* <Icon icon="ph:hanger-simple" className="w-6 h-6" /> */}
            <span className="text-xs">智慧衣櫃</span>
          </Link>

          <Link
            to="/upload"
            className="-mt-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full p-1 shadow-xl active:scale-95"
            aria-label="新增"
          >
            <div className="bg-white rounded-full p-3">
              <Icon icon="mdi:plus-circle-outline" className="w-10 h-10 text-blue-600" />
            </div>
          </Link>

          <Link
            to="/assistant"
            className="flex flex-col items-center text-sm text-gray-700 hover:text-blue-600"
            aria-label="小助手"
          >
            {/* 小助手可用機器人或魔杖 */}
            <Icon icon="mdi:robot-excited-outline" className="w-6 h-6" />
            {/* <Icon icon="mdi:magic-staff" className="w-6 h-6" /> */}
            <span className="text-xs">小助手</span>
          </Link>

          <Link
            to="/profile"
            className="flex flex-col items-center text-sm text-gray-700 hover:text-blue-600"
            aria-label="我的"
          >
            <Icon icon="mdi:account-circle-outline" className="w-6 h-6" />
            <span className="text-xs">我的</span>
          </Link>
        </div>
      </nav>

      {/* Desktop left sidebar - only visible on lg+ */}
      <aside className="left-sidebar fixed inset-y-0 left-0 bg-white/90 z-30 hidden lg:flex">
        <div className="mt-6 flex-1">
          <div className="mb-6 px-2">
            <div className="text-xl font-bold">智慧穿搭</div>
            <div className="text-xs text-gray-500">每日建議 · AI 標註</div>
          </div>
          <nav className="px-2 space-y-2">
            <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <Icon icon="mdi:home-outline" className="w-5 h-5" />
              <span>首頁</span>
            </Link>
            <Link to="/wardrobe" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <Icon icon="mdi:wardrobe-outline" className="w-5 h-5" />
              <span>智慧衣櫃</span>
            </Link>
            <Link to="/upload" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <Icon icon="mdi:plus-circle-outline" className="w-5 h-5" />
              <span>新增衣物</span>
            </Link>
            <Link to="/assistant" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <Icon icon="mdi:robot-excited-outline" className="w-5 h-5" />
              <span>穿搭小助手</span>
            </Link>
            <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100">
              <Icon icon="mdi:account-circle-outline" className="w-5 h-5" />
              <span>我的</span>
            </Link>
          </nav>
        </div>
      </aside>
    </>
  );
}
