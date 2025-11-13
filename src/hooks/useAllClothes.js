// src/hooks/useAllClothes.js
// 💡 優化: 重構成使用 SWR，並新增 options 參數來控制 scope
import useSWR from 'swr';
import fetchJSON from '../lib/api'; 

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1"; 

/**
 * 統一的衣物資料獲取 Hook (使用 SWR)
 * 預設只獲取當前登入使用者的衣物
 * @param {object} options - 選項, e.g., { scope: 'all' }
 */
export default function useAllClothes(options = {}) {
  // 🚨 修正: 根據 options.scope 決定是否加上 &scope=all
  const scopeQuery = options.scope === 'all' ? '&scope=all' : '';
  const url = `${API_BASE}/clothes?limit=1000${scopeQuery}`; 
  
  // 如果是訪客，則不發送請求，直接返回空列表
  try {
    const token = localStorage.getItem("token") || "";
    // 您的登入邏輯中，訪客 token 以 'guest-token' 開頭
    if (token.startsWith('guest-token')) { 
        return { 
            allItems: [], 
            loading: false, 
            error: "訪客無法查看衣櫃，請用註冊帳號或其他使用者登入",
            mutate: async () => {},
        };
    }
  } catch {}

  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetchJSON,
    {
      revalidateIfStale: true,
      revalidateOnFocus: false, 
      dedupingInterval: 10000, 
    }
  );

  const allItems = Array.isArray(data) ? data : (Array.isArray(data?.initialItems) ? data.initialItems : []);
  
  return { 
    allItems, 
    loading: isLoading, 
    error: error ? (error.message || "載入衣物資料失敗") : null,
    mutate // 導出 SWR 的 mutate 函數
  };
}