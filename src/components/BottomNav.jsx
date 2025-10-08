// src/components/BottomNav.jsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";

export default function BottomNav({ isAdmin = false }) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  // 判斷 active
  const isActive = (path) => loc.pathname === path;

  if (isAdmin) {
    // Admin: 若要更完整管理介面，建議改用 AdminSidebar.jsx（下方有獨立檔案）
    return (
      <aside className="left-sidebar">
        <div className="mt-6 flex-1 overflow-y-auto px-2">
          <nav className="space-y-2">
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                isActive("/admin")
                  ? "bg-gray-100 font-medium"
                  : "hover:bg-gray-50"
              }`}
              aria-current={isActive("/admin") ? "page" : undefined}
            >
              <Icon icon="mdi:view-dashboard-outline" className="w-5 h-5" />
              <span>儀表板</span>
            </Link>

            <Link
              to="/admin/users"
              className={`mt-1 flex items-center gap-3 px-3 py-2 rounded-md ${
                isActive("/admin/users")
                  ? "bg-gray-100 font-medium"
                  : "hover:bg-gray-50"
              }`}
            >
              <Icon icon="mdi:account-multiple-outline" className="w-5 h-5" />
              <span>使用者管理</span>
            </Link>

            <Link
              to="/admin/content"
              className={`mt-1 flex items-center gap-3 px-3 py-2 rounded-md ${
                isActive("/admin/content")
                  ? "bg-gray-100 font-medium"
                  : "hover:bg-gray-50"
              }`}
            >
              <Icon icon="mdi:file-document-outline" className="w-5 h-5" />
              <span>內容管理</span>
            </Link>

            <Link
              to="/admin/settings"
              className={`mt-1 flex items-center gap-3 px-3 py-2 rounded-md ${
                isActive("/admin/settings")
                  ? "bg-gray-100 font-medium"
                  : "hover:bg-gray-50"
              }`}
            >
              <Icon icon="mdi:cog-outline" className="w-5 h-5" />
              <span>系統設定</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                // TODO: 實作登出
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
              className="mt-6 w-full text-left px-3 py-2 rounded-md hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Icon icon="mdi:logout" className="w-5 h-5" />
                <span>登出</span>
              </div>
            </button>
          </nav>
        </div>
      </aside>
    );
  }

  // 使用者版（原本的 mobile bottom nav + desktop left sidebar）
  return (
    <>
      {/* Mobile bottom nav - hidden on md+ */}
      <nav
        className="fixed left-4 right-4 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-lg z-40 md:hidden"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
        aria-label="底部導覽"
      >
        <div className="max-w-3xl mx-auto flex justify-between items-center px-6 py-3">
          <Link
            to="/home"
            className={`flex flex-col items-center text-sm ${
              isActive("/home") ? "text-blue-600" : "text-gray-700"
            } `}
            aria-label="首頁"
          >
            <Icon icon="mdi:home-outline" className="w-6 h-6" />
            <span className="text-xs">首頁</span>
          </Link>

          <Link
            to="/wardrobe"
            className={`flex flex-col items-center text-sm ${
              isActive("/wardrobe") ? "text-blue-600" : "text-gray-700"
            } `}
            aria-label="智慧衣櫃"
          >
            <Icon icon="mdi:wardrobe-outline" className="w-6 h-6" />
            <span className="text-xs">衣櫃</span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="-mt-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full p-1 shadow-xl active:scale-95"
            aria-label="新增"
          >
            <div className="bg-white rounded-full p-3">
              <Icon
                icon="mdi:plus-circle-outline"
                className="w-10 h-10 text-blue-600"
              />
            </div>
          </button>

          <Link
            to="/assistant"
            className={`flex flex-col items-center text-sm ${
              isActive("/assistant") ? "text-blue-600" : "text-gray-700"
            } `}
            aria-label="小助手"
          >
            <Icon icon="mdi:robot-excited-outline" className="w-6 h-6" />
            <span className="text-xs">小助手</span>
          </Link>

          <Link
            to="/profile"
            className={`flex flex-col items-center text-sm ${
              isActive("/profile") ? "text-blue-600" : "text-gray-700"
            } `}
            aria-label="我的"
          >
            <Icon icon="mdi:account-circle-outline" className="w-6 h-6" />
            <span className="text-xs">我的</span>
          </Link>
        </div>
      </nav>

      {/* Action Sheet for + button (mobile) */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          {/* Sheet */}
          <div
            className="relative mx-3 mb-3 rounded-2xl bg-white shadow-2xl border border-gray-100 p-4"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
            }}
          >
            <div className="flex items-stretch gap-3">
              <Link
                to="/upload/select"
                onClick={() => setOpen(false)}
                className="flex-1 flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 p-4 active:scale-95"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Icon icon="mdi:hanger" className="h-7 w-7" />
                </span>
                <span className="text-sm font-medium text-gray-800">
                  新增衣物
                </span>
              </Link>

              <Link
                to="/post"
                onClick={() => setOpen(false)}
                className="flex-1 flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 p-4 active:scale-95"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <Icon icon="mdi:sparkles" className="h-7 w-7" />
                </span>
                <span className="text-sm font-medium text-gray-800">
                  上傳貼文
                </span>
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 w-full rounded-xl bg-gray-100 py-2 text-sm text-gray-700 active:scale-95"
              aria-label="關閉"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {/* Desktop left sidebar - only visible on lg+ */}
      <aside className="left-sidebar">
        <div className="mt-6 flex-1 overflow-y-auto px-2">
          <nav className="space-y-2">
            <Link
              to="/home"
              className={`flex items-center gap-3 px-3 py-2 rounded ${
                isActive("/home")
                  ? "bg-gray-100 font-medium"
                  : "hover:bg-gray-50"
              }`}
            >
              <Icon icon="mdi:home-outline" className="w-5 h-5" />
              <span>首頁</span>
            </Link>
            <Link
              to="/wardrobe"
              className={`flex items-center gap-3 px-3 py-2 rounded ${
                isActive("/wardrobe")
                  ? "bg-gray-100 font-medium"
                  : "hover:bg-gray-50"
              }`}
            >
              <Icon icon="mdi:wardrobe-outline" className="w-5 h-5" />
              <span>智慧衣櫃</span>
            </Link>
            <Link
              to="/upload/select"
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50"
            >
              <Icon icon="mdi:plus-circle-outline" className="w-5 h-5" />
              <span>新增衣物</span>
            </Link>
            <Link
              to="/post"
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50"
            >
              <Icon icon="mdi:plus-circle-outline" className="w-5 h-5" />
              <span>上傳貼文</span>
            </Link>
            <Link
              to="/assistant"
              className={`flex items-center gap-3 px-3 py-2 rounded ${
                isActive("/assistant")
                  ? "bg-gray-100 font-medium"
                  : "hover:bg-gray-50"
              }`}
            >
              <Icon icon="mdi:robot-excited-outline" className="w-5 h-5" />
              <span>穿搭小助手</span>
            </Link>
            <Link
              to="/profile"
              className={`flex items-center gap-3 px-3 py-2 rounded ${
                isActive("/profile")
                  ? "bg-gray-100 font-medium"
                  : "hover:bg-gray-50"
              }`}
            >
              <Icon icon="mdi:account-circle-outline" className="w-5 h-5" />
              <span>我的</span>
            </Link>
          </nav>
        </div>
      </aside>
    </>
  );
}
