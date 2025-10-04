// src/components/wardrobe/WardrobeOverview.jsx
import { useState } from 'react';
import WardrobeItem from '../WardrobeItem'; // 假設你已有的元件

// 初始衣物 + 模板
const initialItems = [
  // 預設的模板衣物
  { id: 1, name: "白色 T 恤", category: "上衣", wearCount: 15, img: "/images/tshirt.png" },
  { id: 2, name: "牛仔褲", category: "褲裝", wearCount: 25, img: "/images/jeans.png" },
  { id: 3, name: "黑色洋裝", category: "裙裝", wearCount: 3, img: "/images/blackdress.png" },
  { id: 4, name: "風衣外套", category: "外套", wearCount: 8, img: "/images/windbreakerjacket.png" },
  { id: 5, name: "A字裙", category: "裙裝", wearCount: 1, img: "/images/alineshirt.png" },
  { id: 6, name: "襯衫", category: "上衣", wearCount: 0, img: "/images/shirt.png" },
  { id: 7, name: "寬褲", category: "褲裝", wearCount: 0, img: "/images/pants.png" },
  { id: 8, name: "棒球外套", category: "外套", wearCount: 0, img: "/images/jacket.png" },
  { id: 9, name: "背心", category: "外套", wearCount: 0, img: "/images/vest.png" },
  { id: 10, name: "帽子", category: "配飾", wearCount: 0, img: "/images/cap.png" },
];

// 篩選類別
const filters = ["全部", "上衣", "褲裝", "外套", "裙裝", "配飾"];

export default function WardrobeOverview() {
  const [items, setItems] = useState(initialItems);
  const [activeFilter, setActiveFilter] = useState(filters[0]);

  const filteredItems = items.filter(
    (it) => activeFilter === "全部" || it.category === activeFilter
  );

  return (
    <div>
      {/* 篩選按鈕 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
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

      {/* 衣物清單 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((it) => (
          <WardrobeItem key={it.id} item={it} />
        ))}
      </div>
    </div>
  );
}
