// src/components/wardrobe/WardrobeOverview.jsx
import { useState } from 'react';
import WardrobeItem from '../WardrobeItem'; // 假設你已有的元件
import inactiveMock from '../../mock/inactiveMock'; // 新：拿 90 天未穿的假資料

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

// 轉換外部 mock 的 category 到中文（如果需要）
function mapCategoryToZh(cat) {
  const m = {
    pants: "褲裝",
    outer: "外套",
    tops: "上衣",
    skirt: "裙裝",
    shoes: "配飾",
    // fallback
  };
  return m[cat] ?? cat;
}

// 合併 initialItems 與 inactiveMock（把 inactiveMock 的 item 加入，或合併 daysInactive）
function buildMergedItems(baseItems, inactiveList) {
  const mapById = new Map();
  baseItems.forEach(it => mapById.set(it.id, { ...it }));

  inactiveList.forEach(entry => {
    const it = entry.item;
    const days = entry.item.daysInactive ?? entry.daysInactive ?? 0;
    if (mapById.has(it.id)) {
      // 若原本有相同 id，加入 daysInactive 欄位（不覆蓋原有 img/name）
      const existed = mapById.get(it.id);
      existed.daysInactive = days;
      mapById.set(it.id, existed);
    } else {
      // 新增項目：把外部欄位映射到本地結構
      mapById.set(it.id, {
        id: it.id,
        name: it.name,
        category: mapCategoryToZh(it.category),
        wearCount: 0,
        img: it.imageUrl || it.img || '/images/placeholder.png',
        daysInactive: days,
      });
    }
  });

  // 回傳陣列（保留原 baseItems 順序，再加上新增的 inactive 項）
  const baseIds = new Set(baseItems.map(b => b.id));
  const merged = [...baseItems.map(b => mapById.get(b.id))];
  // append those from mapById not in baseItems (preserve insertion order from Map)
  for (const [id, val] of mapById) {
    if (!baseIds.has(id)) merged.push(val);
  }
  return merged;
}

export default function WardrobeOverview() {
  const INACTIVE_THRESHOLD = 90; // 90 天未穿視為不活躍
  const [items, setItems] = useState(() => buildMergedItems(initialItems, inactiveMock));
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
          <div key={it.id} className="relative">
            {/* 若有超過閾值的 daysInactive，顯示 badge */}
            {typeof it.daysInactive === 'number' && it.daysInactive >= INACTIVE_THRESHOLD && (
              <div className="absolute top-2 right-2 z-10">
                <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full shadow">
                  已 {it.daysInactive} 天未穿
                </span>
              </div>
            )}

            {/* 使用現有的 WardrobeItem 元件呈現內容（若你元件能接收額外 prop，可再擴充） */}
            <WardrobeItem item={it} />
          </div>
        ))}
      </div>
    </div>
  );
}
