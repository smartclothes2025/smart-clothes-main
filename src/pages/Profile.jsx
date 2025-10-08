import { useState } from "react";
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

  return (
    <Layout title="個人檔案">
      <div className="page-wrapper">
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-3xl">
              頭貼
            </div>
            <div>
              <div className="text-lg font-semibold">姓名</div>
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
              <>
                <ExampleCard
                  emoji="😊"
                  title="標題"
                  desc="內容"
                />
              </>
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
