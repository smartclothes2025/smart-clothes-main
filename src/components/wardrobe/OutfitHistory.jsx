import { useState, useEffect } from 'react';

export default function OutfitHistory() {
  // 讀取或初始化資料
  const [outfits, setOutfits] = useState(() => {
    const saved = localStorage.getItem('outfit_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [note, setNote] = useState('');
  const [img, setImg] = useState('');

  // 儲存到 localStorage
  useEffect(() => {
    localStorage.setItem('outfit_history', JSON.stringify(outfits));
  }, [outfits]);

  // 新增今日穿搭
  const addTodayOutfit = () => {
    const today = new Date().toISOString().split('T')[0];
    const newOutfit = {
      id: Date.now(),
      date: today,
      note: note || '無備註',
      img: img || '/default-outfit.png'
    };
    setOutfits([...outfits, newOutfit]);
    setNote('');
    setImg('');
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">每日穿搭紀錄</h2>

      {/* 新增區塊 */}
      <div className="flex flex-col gap-2 mb-6">
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="備註（例如：上課、約會、出遊）"
          className="border rounded-md p-2"
        />
        <input
          value={img}
          onChange={e => setImg(e.target.value)}
          placeholder="穿搭圖片網址（可留空）"
          className="border rounded-md p-2"
        />
        <button
          onClick={addTodayOutfit}
          className="bg-indigo-600 text-white rounded-md py-2 hover:bg-indigo-700"
        >
          新增今日穿搭
        </button>
      </div>

      {/* 顯示歷史紀錄 */}
      {outfits.length === 0 ? (
        <p className="text-gray-500">目前沒有穿搭紀錄。</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {outfits.map(o => (
            <div key={o.id} className="border rounded-lg p-3 bg-white shadow-sm">
              <div className="aspect-square w-full flex items-center justify-center">
                <img
                  src={o.img}
                  alt="outfit"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="mt-2 text-sm">
                <div className="font-medium">{o.date}</div>
                <div className="text-gray-500">{o.note}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
