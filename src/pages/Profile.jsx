import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import { Cog6ToothIcon, PencilSquareIcon, HeartIcon } from "@heroicons/react/24/outline";
import PostCard from "../components/PostCard";

const StyledButton = ({ children, onClick, variant = "primary", className = "" }) => {
  const baseClasses =
    "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2";

  const styles = {
    primary: "text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-md transform hover:-translate-y-px",
    secondary: "text-slate-700 bg-white border border-slate-300 hover:bg-slate-50",
  };

  const applied = styles[variant] || styles.primary;

  return (
    <button onClick={onClick} className={`${baseClasses} ${applied} ${className}`}>
      {children}
    </button>
  );
};

const StatItem = ({ count, label }) => (
  <div className="text-center">
    <div className="font-bold text-xl text-slate-700">{count}</div>
    <div className="text-sm text-slate-500">{label}</div>
  </div>
);

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 relative ${
      active ? "text-indigo-600" : "text-slate-500 hover:text-indigo-500"
    }`}
  >
    {label}
    {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-indigo-500 rounded-full" />}
  </button>
);

export default function Profile() {
  const [tab, setTab] = useState("posts");
  const [user, setUser] = useState({ displayName: "載入中...", bio: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 先從 localStorage 讀一次（存在就立即顯示）
    let initialUser = null;
    try {
      initialUser = JSON.parse(localStorage.getItem("user") || "null");
      if (initialUser) {
        setUser(prev => ({
          ...prev,
          displayName: initialUser.display_name || initialUser.name || initialUser.email || "用戶",
          bio: initialUser.bio || "還沒有個人簡介，點擊編輯按鈕來新增吧！",
        }));
      }
    } catch (e) {
      console.warn("讀取使用者暫存資料失敗：", e);
    }

    // 若有 token，向後端取得最新資料（並用 initialUser 作為 fallback）
    const token = localStorage.getItem("token");
    if (!token) return;

    const controller = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/auth/me", {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          signal: controller.signal,
        });

        if (!res.ok) {
          // 可根據需要顯示錯誤
          console.warn("auth/me 回傳非 200：", res.status);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setUser(prev => ({
          displayName: data?.display_name ?? data?.name ?? data?.email ?? prev.displayName,
          bio: data?.bio ?? prev.bio,
        }));
      } catch (err) {
        if (err && err.name === "AbortError") {
          // aborted
        } else {
          console.warn("取得使用者資料失敗：", err);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const avatarChar = (user.displayName && user.displayName.charAt(0).toUpperCase()) || "?";

  return (
    <Layout title="個人檔案">
      <div className="page-wrapper py-8">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white p-6 rounded-2xl shadow-md w-full">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-4xl font-semibold text-slate-500">{avatarChar}</span>
              </div>
              <div className="flex-grow w-full text-center sm:text-left">
                <h1 className="text-2xl font-bold text-slate-800">{user.displayName}</h1>
                <p className="text-slate-500 mt-1 text-sm">{user.bio}</p>
                <div className="mt-4 flex justify-center sm:justify-start items-center gap-4">
                  <StyledButton variant="primary" onClick={() => console.log("Edit profile")}>
                    <PencilSquareIcon className="w-4 h-4" />
                    編輯檔案
                  </StyledButton>
                  <Link to="/settings">
                    <StyledButton variant="secondary">
                      <Cog6ToothIcon className="w-4 h-4" />
                      設定
                    </StyledButton>
                  </Link>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-around border-t border-slate-200 pt-4">
              <StatItem count={12} label="貼文" />
              <StatItem count={108} label="粉絲" />
              <StatItem count={75} label="追蹤中" />
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-center border-b border-slate-200">
              <TabButton label="貼文" active={tab === "posts"} onClick={() => setTab("posts")} />
              <TabButton label="收藏" active={tab === "collections"} onClick={() => setTab("collections")} />
              <TabButton label="粉絲" active={tab === "followers"} onClick={() => setTab("followers")} />
            </div>

            <div className="py-6">
              {tab === "posts" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <PostCard />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

StyledButton.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(["primary", "secondary"]),
  className: PropTypes.string,
};
StatItem.propTypes = { count: PropTypes.number, label: PropTypes.string };
TabButton.propTypes = { label: PropTypes.string.isRequired, active: PropTypes.bool, onClick: PropTypes.func };
