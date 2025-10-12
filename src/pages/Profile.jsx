import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full ${
      active ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"
    }`}
  >
    {label}
  </button>
);

const ExampleCard = ({ emoji, title, desc }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm">
    <div className="flex items-start gap-4">
      <div className="text-4xl">{emoji}</div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-gray-500 mt-1">{desc}</div>
      </div>
    </div>
  </div>
);

export default function Profile({ theme, setTheme }) {
  const [tab, setTab] = useState("posts");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    // 先從 localStorage 拿 user，立即顯示暫存名稱，避免初始閃爍
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (storedUser) {
        setDisplayName(
          storedUser.display_name || storedUser.name || storedUser.email || "姓名"
        );
      }
    } catch (e) {
      console.warn("讀取使用者暫存資料失敗：", e);
      throw e;
    }

    // 再呼叫後端 /api/v1/me 取得最新 display_name
    const token = localStorage.getItem("token");
    if (!token) return; // 未登入就跳過

    const controller = new AbortController();
    (async () => {
      try {
        const form = new FormData();
        form.append("token", token);

        // 後端為 /api/v1/auth/me（雖為 GET，依賴的 get_current_user 目前期待 Form，因此先用 POST 呼叫；若後端調整為 Header/Query，這裡再同步修改）
        const res = await fetch("http://127.0.0.1:8000/api/v1/auth/me", {
          method: "POST",
          body: form,
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const name = data?.display_name || data?.email || displayName || "姓名";
        setDisplayName(name);
      } catch (err) {
        // 靜默失敗，保留 localStorage 顯示即可
        console.warn("取得使用者資料失敗：", err);
      }
    })();

    return () => controller.abort();
  }, []);

  return (
    <Layout title="個人檔案">
      <div className="page-wrapper">
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-3xl">
              頭貼
            </div>
            <div>
              <div className="text-lg font-semibold">{displayName || "姓名"}</div>
              <div className="text-sm text-gray-500">介紹</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/settings"
              className="px-3 py-2 border rounded-lg text-sm"
            >
              設定
            </Link>
            <button className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm">
              編輯個人檔案
            </button>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex gap-3">
            <TabButton
              label="貼文"
              active={tab === "posts"}
              onClick={() => setTab("posts")}
            />
            <TabButton
              label="動態"
              active={tab === "activity"}
              onClick={() => setTab("activity")}
            />
            <TabButton
              label="追縱中"
              active={tab === "following"}
              onClick={() => setTab("following")}
            />
          </div>

          <div className="mt-4 space-y-4">
            {tab === "posts" && (
              <ExampleCard emoji="😊" title="標題" desc="內容" />
            )}

            {tab === "activity" && (
              <>
                <div className="text-sm text-gray-600">
                  動態流（最近評論、按讚）
                </div>
                <ExampleCard
                  emoji="💬"
                  title="小美回覆你的穿搭貼文"
                  desc="很適合！"
                />
                <ExampleCard
                  emoji="👍"
                  title="有人按讚你的收藏"
                  desc="已新增到 Ta 的收藏清單"
                />
              </>
            )}

            {tab === "following" && (
              <>
                <div className="text-sm text-gray-600">你追蹤的人</div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="bg-white p-3 rounded-xl shadow-sm text-center">
                    Alice
                  </div>
                  <div className="bg-white p-3 rounded-xl shadow-sm text-center">
                    Bob
                  </div>
                  <div className="bg-white p-3 rounded-xl shadow-sm text-center">
                    Cherry
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

TabButton.propTypes = {
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func,
};

ExampleCard.propTypes = {
  emoji: PropTypes.node,
  title: PropTypes.string,
  desc: PropTypes.string,
};
