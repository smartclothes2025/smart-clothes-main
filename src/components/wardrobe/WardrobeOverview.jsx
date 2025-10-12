// src/components/wardrobe/WardrobeOverview.jsx
import { useEffect, useState } from 'react';

// 圖片資產（Vite import）
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

// ---- 共用：Outfit 存取 ----
const OUTFIT_KEY = 'outfit_history';
const getOutfits = () => {
  try { return JSON.parse(localStorage.getItem(OUTFIT_KEY)) || []; }
  catch { return []; }
};
const saveOutfits = (list) => localStorage.setItem(OUTFIT_KEY, JSON.stringify(list));
const addOutfit = ({ clothesIds = [], note = '', img = '' }) => {
  const list = getOutfits();
  const today = new Date().toISOString().slice(0, 10);
  list.push({
    id: Date.now(),
    date: today,
    clothesIds,
    note: note || '無備註',
    img: img || '/default-outfit.png',
  });
  saveOutfits(list);
};

const initialItems = [
  { id: 1,  name: '白色 T 恤', category: '上衣', wearCount: 15, img: tshirt,            daysInactive: 5 },
  { id: 2,  name: '牛仔褲',   category: '褲裝', wearCount: 25, img: jeans,             daysInactive: 120 },
  { id: 3,  name: '黑色洋裝', category: '裙裝', wearCount: 3,  img: blackdress,        daysInactive: 180 },
  { id: 4,  name: '風衣外套', category: '外套', wearCount: 8,  img: windbreakerjacket, daysInactive: 45 },
  { id: 5,  name: 'A字裙',    category: '裙裝', wearCount: 1,  img: alineshirt,        daysInactive: 91 },
  { id: 6,  name: '襯衫',     category: '上衣', wearCount: 0,  img: shirt,             daysInactive: 0 },
  { id: 7,  name: '寬褲',     category: '褲裝', wearCount: 0,  img: pants,             daysInactive: 300 },
  { id: 8,  name: '棒球外套', category: '外套', wearCount: 0,  img: jacket,            daysInactive: 10 },
  { id: 9,  name: '背心',     category: '外套', wearCount: 0,  img: vest,              daysInactive: 200 },
  { id: 10, name: '帽子',     category: '配飾', wearCount: 0,  img: cap,               daysInactive: 0 },
];

const filters = ['全部', '上衣', '褲裝', '外套', '裙裝', '配飾'];

export default function WardrobeOverview() {
  const INACTIVE_THRESHOLD = 90;

  // 清掉舊的 items 緩存避免覆蓋（保留）
  useEffect(() => {
    try {
      localStorage.removeItem('wardrobe_items');
      localStorage.removeItem('wardrobe_items_seed');
    } catch {}
  }, []);

  const [items] = useState(initialItems);
  const [activeFilter, setActiveFilter] = useState(filters[0]);

  // ✅ 新增：選取 / 新增穿搭所需狀態
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [note, setNote] = useState('');

  const filteredItems = items.filter(
    it => activeFilter === '全部' || it.category === activeFilter
  );

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const createTodayOutfit = () => {
    if (selectedIds.length === 0) return;
    addOutfit({ clothesIds: selectedIds, note });
    setSelectedIds([]);
    setNote('');
    setSelecting(false);
    // 觸發其他分頁更新（OutfitHistory 也有 storage 監聽會自動刷新）
    window.dispatchEvent(new StorageEvent('storage', { key: OUTFIT_KEY }));
    alert('已加入今日穿搭！請到「穿搭」分頁查看。');
  };

  return (
    <div>
      {/* 篩選 + 操作列 */}
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

        <div className="ml-auto flex items-center gap-2">
          {!selecting ? (
            <button
              onClick={() => setSelecting(true)}
              className="px-3 py-1 text-sm rounded-md bg-indigo-600 text-white"
            >
              選取單品
            </button>
          ) : (
            <>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="今日穿搭備註（可留空）"
                className="border rounded-md px-2 py-1 text-sm"
              />
              <button
                onClick={createTodayOutfit}
                disabled={selectedIds.length === 0}
                className="px-3 py-1 text-sm rounded-md bg-green-600 text-white disabled:opacity-50"
              >
                加入今日穿搭（{selectedIds.length}）
              </button>
              <button
                onClick={() => { setSelecting(false); setSelectedIds([]); setNote(''); }}
                className="px-3 py-1 text-sm rounded-md bg-gray-200"
              >
                取消
              </button>
            </>
          )}
        </div>
      </div>

      {/* 卡片清單 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map(it => {
          const active = selectedIds.includes(it.id);
          return (
            <div
              key={it.id}
              className={`relative border rounded-xl p-3 bg-white shadow-sm ${selecting && active ? 'ring-2 ring-indigo-500' : ''}`}
              onClick={() => selecting && toggleSelect(it.id)}
            >
              {/* 已 xx 天未穿徽章（保留） */}
              {typeof it.daysInactive === 'number' && it.daysInactive >= INACTIVE_THRESHOLD && (
                <div className="absolute top-2 right-2 z-10">
                  <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full shadow">
                    已 {it.daysInactive} 天未穿
                  </span>
                </div>
              )}

              {/* 選取圓點 */}
              {selecting && (
                <div
                  className={`absolute top-2 left-2 w-5 h-5 rounded-full border
                  ${active ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}
                />
              )}

              {/* 圖片與資訊 */}
              <div className="aspect-square w-full overflow-hidden rounded-lg flex items-center justify-center">
                <img src={it.img} alt={it.name} className="max-w-full max-h-full object-contain" />
              </div>
              <div className="mt-2 text-sm">
                <div className="font-medium">{it.name}</div>
                <div className="text-gray-500">{it.category}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
