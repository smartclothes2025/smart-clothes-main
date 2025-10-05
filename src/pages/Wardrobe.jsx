// src/pages/Wardrobe.jsx
import { useState } from 'react';
import Header from '../components/Header';
import WardrobeOverview from '../components/wardrobe/WardrobeOverview';
import Outfits from '../components/wardrobe/Outfits';
import Analysis from '../components/wardrobe/Analysis';

const mainTabs = ["衣物總覽", "穿搭", "分析"];

export default function Wardrobe({ theme, setTheme }) {
  const [activeTab, setActiveTab] = useState(mainTabs[0]);

  return (
  <div className="min-h-full pb-32 pt-2 md:pb-0 px-2">
      <Header title="智慧衣櫃" theme={theme} setTheme={setTheme} />
      <div className="lg:pl-72">
        <div className="max-w-6xl mx-auto px-4">
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
