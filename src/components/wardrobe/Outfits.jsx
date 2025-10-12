// src/components/wardrobe/Outfits.jsx
import { useState, useEffect, useMemo } from 'react';

// 卡片元件
const OutfitCard = ({ outfit }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    <div className="aspect-[3/4] w-full overflow-hidden bg-gray-50">
      <img
        src={outfit.img || '/default-outfit.png'}
        alt="Outfit"
        className="w-full h-full object-cover"
        onError={e => (e.currentTarget.src = '/default-outfit.png')}
      />
    </div>
    <div className="p-2 text-sm text-gray-600">
      <div>{outfit.date}</div>
      {outfit.note && <div className="text-gray-400 text-xs">{outfit.note}</div>}
    </div>
  </div>
);

export default function Outfits() {
  const [outfits, setOutfits] = useState([]);

  // 從 localStorage 載入穿搭資料
  useEffect(() => {
    const saved = localStorage.getItem('outfit_history');
    if (saved) setOutfits(JSON.parse(saved));
  }, []);

  // 若有其他分頁新增穿搭（storage 事件）
  useEffect(() => {
    const refresh = () => {
      const saved = localStorage.getItem('outfit_history');
      if (saved) setOutfits(JSON.parse(saved));
    };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  // ✅ 按年月分組
  const groupedByMonth = useMemo(() => {
    return outfits.reduce((acc, outfit) => {
      const yearMonth = outfit.date?.substring(0, 7) || '未知日期';
      if (!acc[yearMonth]) acc[yearMonth] = [];
      acc[yearMonth].push(outfit);
      return acc;
    }, {});
  }, [outfits]);

  // 排序：最新的月份在最上面
  const sortedMonths = Object.keys(groupedByMonth).sort().reverse();

  if (outfits.length === 0) {
    return <p className="text-gray-500 p-4">目前沒有穿搭紀錄，請先新增。</p>;
  }

  return (
    <div className="p-4">
      {sortedMonths.map(month => (
        <section key={month} className="mb-6">
          <h2 className="text-lg font-semibold mb-3">
            {month.replace('-', ' 年 ')} 月
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {groupedByMonth[month].map(outfit => (
              <OutfitCard key={outfit.id} outfit={outfit} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
