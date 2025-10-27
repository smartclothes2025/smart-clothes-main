import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import { XMarkIcon, ArrowDownTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
// [修正] 移除對外部套件的依賴，使用自定義 SVG
// import { mdiLoading } from '@mdi/js'; 
// import Icon from '@mdi/react'; 

// Mock variables (保持一致性)
const __app_id = 'clothing-search-app';
const __firebase_config = '{}';
const __initial_auth_token = 'mock-token';

// SearchIcon 元件 (保留您原本的 SVG 結構)
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-black"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

// [新增] 簡單的 Loading Icon 元件 (使用 SVG 實現)
const LoadingIcon = ({ size = 2, className = "text-indigo-500" }) => (
  <svg
    className={`animate-spin ${className}`}
    style={{ width: `${size}rem`, height: `${size}rem` }}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);


// --- 搜尋結果的彈窗元件 (僅用於 'internal' 模式) ---
const SearchResultsModal = ({ loading, error, results, onClose, searchType }) => {
  const [show, setShow] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300); // 等待動畫結束後才關閉
  };

  // 下載處理函數 (僅供參考，此模式下通常用於內部資源)
  const handleDownloadClick = async (e, img, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (downloadingId === index) return;
    setDownloadingId(index);
    // 假設後端有提供一個 /download-proxy 端點來處理跨域下載
    try {
      const response = await axios.get(
        "http://localhost:8000/api/v1/search/download-proxy",
        {
          params: { url: img.url || img.thumbnail },
          responseType: 'blob'
        }
      );
      const blob = new Blob([response.data]);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = img.title ? `${img.title}.jpg` : 'download.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("下載失敗:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const title = searchType === 'external' ? 'Google 搜尋結果 (已停用彈窗)' : '全站資料搜尋結果';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'
        }`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div
        className={`relative bg-white rounded-2xl shadow-xl w-[min(1000px,95%)] z-10 transition-all duration-300 flex flex-col ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        style={{ maxHeight: '85vh' }}
      >
        {/* 標題列 */}
        <div className="flex justify-between items-center p-5 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* 內容 (可滾動) */}
        <div className="p-5 overflow-y-auto">
          {loading && (
            <div className="flex justify-center items-center py-10">
              <LoadingIcon size={1.5} className="text-indigo-500" />
              <p className="text-center text-slate-500 ml-3">搜尋中...</p>
            </div>
          )}

          {error && (
            <p className="text-center text-red-600 py-10">{error}</p>
          )}

          {!loading && !error && results.length === 0 && (
            <p className="text-center text-slate-500 py-10">找不到相關結果。</p>
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {results.map((img, index) => (
                <a
                  key={index}
                  href={img.context || img.url} // 點擊連到來源網頁
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square bg-slate-100 rounded-lg overflow-hidden block shadow hover:shadow-lg transition-shadow group relative"
                >
                  <img
                    src={img.url || img.thumbnail}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />

                  <button
                    type="button"
                    onClick={(e) => handleDownloadClick(e, img, index)}
                    disabled={downloadingId === index}
                    className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-full text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all disabled:opacity-100"
                    aria-label="下載圖片"
                  >
                    {downloadingId === index ? (
                      <LoadingIcon size={0.8} className="text-white" />
                    ) : (
                      <ArrowDownTrayIcon className="w-5 h-5" />
                    )}
                  </button>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [query, setQuery] = useState("");
  // [保留] 彈窗狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  // [保留] 搜尋類型狀態
  const [searchType, setSearchType] = useState('external'); // 'external' 或 'internal'

  // (Modal 內的狀態)
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // [API 端點] Google 搜尋 API 已停用，但保留此變數
  // const API_ENDPOINT_GOOGLE = "http://localhost:8000/api/v1/search/images";
  // [API 端點] 全站搜尋 API 端點 (假設您將後端路由改為此)
  const API_ENDPOINT_INTERNAL = "http://localhost:8000/api/v1/search/full-site-data";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // --- 模式一：Google 搜尋 (直接導向新標籤) ---
    // 這是最可靠的方式，避免 API 限制
    if (searchType === 'external') {
      const encodedQuery = encodeURIComponent(trimmedQuery);
      // tbm=isch: 圖片搜尋, hl=zh-TW: 語言, gl=tw: 地理位置
      const googleUrl = `https://www.google.com/search?q=${encodedQuery}&tbm=isch&hl=zh-TW&gl=tw`;

      window.open(googleUrl, '_blank');
      // 確保 Modal 關閉
      if (isModalOpen) setIsModalOpen(false);
      return;
    }

    // --- 模式二：全站搜尋 (API 呼叫並顯示 Modal) ---

    // 1. 打開彈窗並開始載入
    setLoading(true);
    setError(null);
    setResults([]);
    setIsModalOpen(true);

    try {
      // 呼叫全站搜尋 API (後端應實作此路由)
      const response = await axios.get(API_ENDPOINT_INTERNAL, {
        params: { q: query }
      });

      // 假設全站搜尋回傳的是與圖片/連結相關的資料結構
      setResults(response.data);

    } catch (err) {
      console.error("全站搜尋失敗:", err);
      setError(err.response?.data?.detail || "全站搜尋服務發生錯誤，請檢查後端。");
    } finally {
      setLoading(false);
    }
  };

  // [保留] 需求 3：切換按鈕的元件
  const SearchTypeToggle = () => (
    <div className="flex justify-center mt-3 mb-1">
      <div className="flex p-1 bg-slate-100 rounded-full">
        <button
          type="button"
          onClick={() => setSearchType('external')}
          className={`px-6 py-1.5 rounded-full text-sm font-semibold ${searchType === 'external'
            ? 'bg-white shadow text-indigo-700'
            : 'text-slate-500 hover:text-slate-800'
            } transition-all`}
        >
          Google 搜尋
        </button>
        <button
          type="button"
          onClick={() => setSearchType('internal')}
          className={`px-6 py-1.5 rounded-full text-sm font-semibold ${searchType === 'internal'
            ? 'bg-white shadow text-indigo-700'
            : 'text-slate-500 hover:text-slate-800'
            } transition-all`}
        >
          全站搜尋
        </button>
      </div>
    </div>
  );

  return (
    <section>
        <form className="relative w-full" onSubmit={handleSubmit}>
          <div className="absolute top-1 left-1 h-full w-full rounded-2xl bg-[#F87171]"></div>
          <div className="relative flex h-full w-full items-center rounded-2xl border-2 border-black bg-white px-4 py-3">
            <div className="mr-4">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder={searchType === 'external' ? '搜尋 Google 穿搭靈感' : '搜尋站內貼文'}
              className="w-full bg-transparent text-xl font-medium text-black placeholder-black focus:outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="hidden">搜尋</button>
          </div>
        </form>
        {/* [保留] 顯示切換按鈕 */}
        <SearchTypeToggle />

        {/* [保留] 彈窗顯示 (僅在 'internal' 模式下有用) */}
        {isModalOpen && (
          <SearchResultsModal
            loading={loading}
            error={error}
            results={results}
            searchType={searchType}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </section>
  );
};

export default App;
