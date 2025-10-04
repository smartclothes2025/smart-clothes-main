// src/pages/Wardrobe.jsx
import { useState } from 'react';
import Header from '../components/Header';
import WardrobeOverview from '../components/wardrobe/WardrobeOverview';
import Outfits from '../components/wardrobe/Outfits';
import Analysis from '../components/wardrobe/Analysis';

// 頂層分頁
const mainTabs = ["衣物總覽", "穿搭", "分析"];

export default function Wardrobe({ theme, setTheme }) {
  const [activeTab, setActiveTab] = useState(mainTabs[0]);

  return (
    /* 外層只負責 page-level spacing（header + sidebar + bottomnav 預留）*/
  <div className="min-h-full pb-32 md:pb-0">
      {/* header：如果你把 Header 放在 App 最上層也可以刪掉這行 */}
      <Header title="智慧衣櫃" theme={theme} setTheme={setTheme} />

      {/* lg:pl-72 用來預留左側固定側邊欄的寬度（要和你的 aside 寬度一致） */}
      <div className="lg:pl-72">
        {/* 內層容器：限制寬度並置中，避免內容貼邊看起來擠 */}
        <div className="max-w-6xl mx-auto px-4">
          {/* 頂層分頁按鈕 (已放大) */}
          <div className="mt-3 flex gap-4 border-b border-gray-200 pb-3 mb-4">
            {mainTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-lg font-semibold rounded-t-lg transition-colors
                  ${activeTab === tab
                    ? "border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50"
                    : "text-gray-500 hover:text-indigo-600"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* 根據 activeTab 顯示對應的內容元件 */}
          <div>
            {activeTab === "衣物總覽" && <WardrobeOverview />}
            {activeTab === "穿搭" && <Outfits />}
            {activeTab === "分析" && <Analysis />}
          </div>
        </div>
      </div>
    </div>
  );
}
