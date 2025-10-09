// src/components/wardrobe/WardrobeOverview.jsx
import { useEffect, useState } from 'react';
// 先暫時不用 WardrobeItem、inactiveMock，排除干擾
// import WardrobeItem from '../WardrobeItem';
// import inactiveMock from '../../mock/inactiveMock';

// 1) 用 Vite 的資產匯入（確保 HMR 正常）
import tshirt from '../../assets/t-shirt.png';
import jeans from '../../assets/jeans.png';
import blackdress from '../../assets/blackdress.png';
import windbreakerjacket from '../../assets/windbreakerjacket.png';
import alineshirt from '../../assets/alineshirt.png';
import shirt from '../../assets/shirt.png';
import pants from '../../assets/pants.png';
import jacket from '../../assets/jacket.png';
import vest from '../../assets/vest.png';
import cap from '../../assets/cap.png';

import OutfitHistory from './OutfitHistory';

// 2) 先用最單純的初始陣列（不合併、不讀外部資料）
const initialItems = [
  { id: 1,  name: '白色 T 恤', category: '上衣', wearCount: 15, img: tshirt },
  { id: 2,  name: '牛仔褲',   category: '褲裝', wearCount: 25, img: jeans },
  { id: 3,  name: '黑色洋裝', category: '裙裝', wearCount: 3,  img: blackdress },
  { id: 4,  name: '風衣外套', category: '外套', wearCount: 8,  img: windbreakerjacket },
  { id: 5,  name: 'A字裙',    category: '裙裝', wearCount: 1,  img: alineshirt },
  { id: 6,  name: '襯衫',     category: '上衣', wearCount: 0,  img: shirt },
  { id: 7,  name: '寬褲',     category: '褲裝', wearCount: 0,  img: pants },
  { id: 8,  name: '棒球外套', category: '外套', wearCount: 0,  img: jacket },
  { id: 9,  name: '背心',     category: '外套', wearCount: 0,  img: vest },
  { id: 10, name: '帽子',     category: '配飾', wearCount: 0,  img: cap },
];

const filters = ['全部', '上衣', '褲裝', '外套', '裙裝', '配飾'];

export default function WardrobeOverview() {
  // 3) 清 localStorage（若之前有把 items 存起來會覆蓋掉新的）
  useEffect(() => {
    try {
      localStorage.removeItem('wardrobe_items');          // 可能用這個 key
      localStorage.removeItem('wardrobe_items_seed');     // 或這個 key
    } catch (_) {}
  }, []);

  const [items] = useState(initialItems);
  const [activeFilter, setActiveFilter] = useState(filters[0]);

  const filteredItems = items.filter(
    it => activeFilter === '全部' || it.category === activeFilter
  );

  return (
    <div>
      {/* 篩選 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1 text-sm rounded-full transition-colors
              ${activeFilter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 4) 直接用 <img> 渲染來驗證圖片，暫時不走 WardrobeItem */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map(it => (
          <div key={it.id} className="border rounded-xl p-3 bg-white shadow-sm">
            <div className="aspect-square w-full overflow-hidden rounded-lg flex items-center justify-center">
              <img src={it.img} alt={it.name} className="max-w-full max-h-full object-contain" />
            </div>
            <div className="mt-2 text-sm">
              <div className="font-medium">{it.name}</div>
              <div className="text-gray-500">{it.category}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    
  );
}
