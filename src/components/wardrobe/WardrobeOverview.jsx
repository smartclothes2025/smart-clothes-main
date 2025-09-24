// src/components/wardrobe/WardrobeOverview.jsx

import { useState } from 'react';
import WardrobeItem from '../WardrobeItem'; // 假設你已有的元件

const initialItems = [
  { id: 1, name: "白色 T 恤", category: "上衣", wearCount: 15, img: null },
  { id: 2, name: "牛仔褲", category: "褲裝", wearCount: 25, img: null },
  { id: 3, name: "黑色洋裝", category: "裙裝", wearCount: 3, img: null },
  { id: 4, name: "風衣外套", category: "外套", wearCount: 8, img: null },
  { id: 5, name: "A字裙", category: "裙裝", wearCount: 1, img: null },
];

const filters = ["全部", "上衣", "褲裝", "外套", "裙裝"];

export default function WardrobeOverview() {
  const [items, setItems] = useState(initialItems);
  const [activeFilter, setActiveFilter] = useState(filters[0]);

  const filteredItems = items.filter(
    (it) => activeFilter === "全部" || it.category === activeFilter
  );

  return (
    <div>
      {/* 搜尋框和篩選按鈕 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* <input type="search" placeholder="搜尋衣物..." className="..."/> */}
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1 text-sm rounded-full transition-colors
              ${activeFilter === f
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 衣物網格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((it) => (
          <WardrobeItem key={it.id} item={it} />
        ))}
        {/* 可以在這裡加上一個「新增衣物」的卡片 */}
      </div>
    </div>
  );
}