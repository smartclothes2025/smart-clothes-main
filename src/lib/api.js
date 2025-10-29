// src/lib/api.js
export async function fetchJSON(url, opts = {}) {
  // 若你想要把 mock 關掉，只把 .env 裡 VITE_USE_MOCK 設 false 或拿掉
  const useMock = import.meta.env.VITE_USE_MOCK === 'true';

  console.log('🔍 fetchJSON Debug:');
  console.log('  URL:', url);
  console.log('  VITE_USE_MOCK:', import.meta.env.VITE_USE_MOCK);
  console.log('  useMock:', useMock);

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
    console.log('  ⚠️ Using MOCK data');
    // 模擬網路延遲（可選）
    await new Promise((r) => setTimeout(r, 200));
    return mockData;
  }

  console.log('  ✅ Using REAL API via proxy');
  
  // 自動從 localStorage 讀取 token 並加入 Authorization header
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...opts.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('  🔑 Added Authorization header with token');
  }
  
  // 真實 fetch（會被 proxy 轉發）
  const res = await fetch(url, {
    ...opts,
    headers,
  });
  console.log('  Response status:', res.status);
  
  if (!res.ok) {
    // 把錯誤丟回上層（SWR 會接到 error）
    const text = await res.text().catch(() => '');
    console.log('  ❌ Error response:', text);
    const err = new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  console.log('  ✅ Success, data length:', Array.isArray(data) ? data.length : 'N/A');
  return data;
}
export default fetchJSON;
