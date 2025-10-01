// src/lib/api.js
export async function fetchJSON(url, opts = {}) {
  // 若你想要把 mock 關掉，只把 .env 裡 VITE_USE_MOCK 設 false 或拿掉
  const useMock = import.meta.env.VITE_USE_MOCK === 'true';

  // ---- MOCK 資料 (可按需改) ----
  const mockData = [
    {
      item: {
        id: 'i-black-pants',
        name: '黑色窄管褲',
        imageUrl: '/mock/black-pants.jpg',
        category: 'pants',
        color: 'black'
      },
      suggestions: [
        { id: 's-white-t', name: '白色T恤', imageUrl: '/mock/white-t.jpg' },
        { id: 's-gray-outer', name: '淺灰針織外套', imageUrl: '/mock/gray-outer.jpg' },
        { id: 's-blue-shirt', name: '藍襯衫', imageUrl: '/mock/blue-shirt.jpg' }
      ],
      days: 120
    },
    {
      item: {
        id: 'i-blue-hoodie',
        name: '藍色連帽外套',
        imageUrl: '/mock/blue-hoodie.jpg',
        category: 'outer',
        color: 'blue'
      },
      suggestions: [
        { id: 's-white-t', name: '白色T恤', imageUrl: '/mock/white-t.jpg' },
        { id: 's-gray-pants', name: '灰色休閒褲', imageUrl: '/mock/gray-pants.jpg' }
      ],
      days: 98
    }
  ];
  // --------------------------------

  if (useMock) {
    // 模擬網路延遲（可選）
    await new Promise((r) => setTimeout(r, 200));
    return mockData;
  }

  // 真實 fetch（會被 proxy 轉發）
  const res = await fetch(url, opts);
  if (!res.ok) {
    // 把錯誤丟回上層（SWR 會接到 error）
    const text = await res.text().catch(() => '');
    const err = new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
    err.status = res.status;
    throw err;
  }
  return await res.json();
}
export default fetchJSON;
