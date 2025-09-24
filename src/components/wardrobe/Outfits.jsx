// src/components/wardrobe/Outfits.jsx

import { useState, useMemo } from 'react';

// 假設的穿搭資料，日期很重要
const sampleOutfits = [
  { id: 1, date: '2025-09-24', imageUrl: 'https://via.placeholder.com/300x400' },
  { id: 2, date: '2025-09-15', imageUrl: 'https://via.placeholder.com/300x400' },
  { id: 3, date: '2025-08-30', imageUrl: 'https://via.placeholder.com/300x400' },
  { id: 4, date: '2025-08-10', imageUrl: 'https://via.placeholder.com/300x400' },
  { id: 5, date: '2024-12-25', imageUrl: 'https://via.placeholder.com/300x400' },
];

// 穿搭卡片元件
const OutfitCard = ({ outfit }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    <img src={outfit.imageUrl} alt="Outfit" className="w-full h-48 object-cover" />
    <div className="p-2 text-sm text-gray-600">
      {outfit.date}
    </div>
  </div>
);

export default function Outfits() {
  const [outfits, setOutfits] = useState(sampleOutfits);

  // 使用 useMemo 來計算分組，避免重複運算
  const groupedByMonth = useMemo(() => {
    return outfits.reduce((acc, outfit) => {
      const yearMonth = outfit.date.substring(0, 7); // e.g., "2025-09"
      if (!acc[yearMonth]) {
        acc[yearMonth] = [];
      }
      acc[yearMonth].push(outfit);
      return acc;
    }, {});
  }, [outfits]);

  // 取得排序後的月份鍵
  const sortedMonths = Object.keys(groupedByMonth).sort().reverse();

  return (
    <div>
      {sortedMonths.map(month => (
        <section key={month} className="mb-6">
          <h2 className="text-lg font-semibold mb-3">{month.replace('-', ' 年 ')} 月</h2>
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