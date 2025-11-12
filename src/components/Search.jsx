import React, { useState } from 'react';
import axios from 'axios';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

const __app_id = 'clothing-search-app';
const __firebase_config = '{}';
const __initial_auth_token = 'mock-token';

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

const App = () => {
  const [query, setQuery] = useState(() => {
    try {
      return sessionStorage.getItem('homepost_search_query') || "";
    } catch {
      return "";
    }
  });
  const [searchType, setSearchType] = useState('external'); // 'external' 或 'internal'

  const API_BASE = import.meta.env.VITE_API_BASE || "https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1";
  const API_ENDPOINT_INTERNAL = `${API_BASE}/search/posts`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      handleClearSearch();
      return;
    }

    if (searchType === 'external') {
      const encodedQuery = encodeURIComponent(trimmedQuery);
      const googleUrl = `https://www.pinterest.com/search/pins/?q=${encodedQuery}&rs=rs&source_id=rs_AtBIBlhK&eq=&etslf=7336`;
      window.open(googleUrl, '_blank');
      return;
    }

    try {
      // 發送載入中事件
      window.dispatchEvent(new CustomEvent('search-posts', { detail: { query: trimmedQuery, loading: true } }));

      // 呼叫全站貼文搜尋 API
      const response = await axios.get(API_ENDPOINT_INTERNAL, {
        params: { 
          q: trimmedQuery,
          limit: 50,
          offset: 0
        }
      });

      const posts = response.data.results || [];

      window.dispatchEvent(new CustomEvent('search-posts', { 
        detail: { 
          query: trimmedQuery, 
          results: posts,
          loading: false 
        } 
      }));

    } catch (err) {
      console.error("全站搜尋失敗:", err);
      // 發送錯誤事件
      window.dispatchEvent(new CustomEvent('search-posts', { 
        detail: { 
          query: trimmedQuery, 
          error: err.response?.data?.detail || "搜尋服務發生錯誤，請稍後再試。",
          loading: false 
        } 
      }));
    }
  };

  // 清除搜尋
  const handleClearSearch = () => {
    setQuery("");
    window.dispatchEvent(new CustomEvent('search-posts', { detail: { query: '', results: null } }));
  };

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
          pinterest搜尋
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
              placeholder={searchType === 'external' ? '搜尋穿搭靈感' : '搜尋站內貼文'}
              className="w-full bg-transparent text-xl font-medium text-black placeholder-black focus:outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="ml-2 p-1 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="清除搜尋"
              >
                <XMarkIcon className="w-5 h-5 text-slate-500" />
              </button>
            )}
            <button type="submit" className="hidden">搜尋</button>
          </div>
        </form>
        {/* 顯示切換按鈕 */}
        <SearchTypeToggle />
      </section>
  );
};

export default App;
