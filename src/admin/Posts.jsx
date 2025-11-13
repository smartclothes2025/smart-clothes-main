// // src/admin/Posts.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import Layout from "../components/Layout";
// import StyledButton from "../components/ui/StyledButton";
// import Page from "../components/Page";
// import { Icon } from "@iconify/react";
// import "../assets/TableStyles.css";
// import AskModal from "../components/AskModal";
// import useSWR from 'swr';
// import fetchJSON from "../lib/api";
// import { useToast } from "../components/ToastProvider";

// // 輔助函式：解析 media 陣列並取得封面圖
// function getPostCoverImage(media) {
//   if (!media) return null;
//   let mediaArr = [];
//   try {
//     if (Array.isArray(media)) mediaArr = media;
//     // 假設 media 欄位可能以 JSON 字串形式儲存
//     else if (typeof media === 'string') mediaArr = JSON.parse(media || "[]");
//   } catch {}
  
//   if (mediaArr.length === 0) return null;
  
//   // 優先找 is_cover 或第一個 media 項目
//   const cover = mediaArr.find(m => m.is_cover) || mediaArr[0];
//   const rawUrl = cover?.url || cover?.authenticated_url || cover?.image_url || cover?.gcs_uri || cover?.image || null;
  
//   // 簡易 GCS 轉換 (用於向下相容或公開連結)
//   if (rawUrl && rawUrl.startsWith("gs://")) {
//     const without = rawUrl.replace("gs://", "");
//     const slash = without.indexOf("/");
//     if (slash > 0) {
//       const bucket = without.slice(0, slash);
//       const object = encodeURI(without.slice(slash + 1));
//       return `https://storage.googleapis.com/${bucket}/${object}`;
//     }
//   }
//   return rawUrl;
// }

// export default function AdminPosts() {
//   const { addToast } = useToast();
//   const API_BASE = import.meta.env.VITE_API_BASE || "";
  
//   // SWR 鍵名：用於獲取所有貼文
//   const cacheKey = `${API_BASE}/posts?limit=1000&scope=all`;
  
//   // 🚨 使用 SWR 獲取所有貼文資料
//   const { data: allItems, error, isLoading, mutate } = useSWR(cacheKey, fetchJSON);

//   const [query, setQuery] = useState("");
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(12);

//   const [askOpen, setAskOpen] = useState(false);
//   const [askTargetId, setAskTargetId] = useState(null);
//   const [isDeleting, setIsDeleting] = useState(false);

//   // 客戶端篩選
//   const filtered = useMemo(() => {
//     // 確保 allItems 是陣列
//     if (!allItems || !Array.isArray(allItems)) return [];
//     const q = query.trim().toLowerCase();
    
//     return allItems.filter((it) => {
//       const byQ =
//         !q ||
//         (it.title || "").toLowerCase().includes(q) ||
//         (it.content || "").toLowerCase().includes(q) ||
//         (it.author_name || "").toLowerCase().includes(q) || // 假設後端提供 author_name
//         String(it.id).includes(q); 
//       return byQ;
//     });
//   }, [allItems, query]);

//   // 分頁
//   const total = filtered.length;
//   const totalPages = Math.max(1, Math.ceil(total / pageSize));
//   const pageItems = useMemo(() => {
//     const start = (page - 1) * pageSize;
//     return filtered.slice(start, start + pageSize);
//   }, [filtered, page, pageSize]);

//   function gotoPage(n) {
//     setPage(Math.max(1, Math.min(totalPages, n)));
//   }

//   // 刪除貼文
//   async function handleDeletePost(id) {
//     if (isDeleting) return;
//     setIsDeleting(true);
    
//     // 樂觀更新 (Optimistic Update)
//     const optimisticData = allItems.filter(item => String(item.id) !== String(id));
//     mutate(optimisticData, {
//         revalidate: false,
//         populateCache: true,
//         rollbackOnError: true,
//     });

//     try {
//       const token = localStorage.getItem("token");
//       const url = `${API_BASE}/posts/${id}`;
      
//       const res = await fetch(url, {
//         method: "DELETE",
//         headers: { Authorization: `Bearer ${token}` },
//       });
      
//       if (!res.ok) {
//          // 🚨 修正後的錯誤解析邏輯
//          const txt = await res.text().catch(() => `HTTP ${res.status}`);
//          let errorDetail = txt;
//          try {
//             const parsed = JSON.parse(txt);
//             errorDetail = parsed?.detail || txt;
//          } catch (e) {
//             // 解析 JSON 失敗，使用原始文字
//          }
//          throw new Error(errorDetail);
//       }
      
//       addToast({ type: 'success', title: '刪除成功', message: `貼文 #${id} 已移除` });
      
//     } catch (err) {
//       addToast({ type: 'error', title: '刪除失敗', message: err.message });
//       mutate(); // 失敗時回滾
//     } finally {
//       setIsDeleting(false);
//       setAskOpen(false);
//       setAskTargetId(null);
//     }
//   }

//   function openAskModal(id) {
//     setAskTargetId(id);
//     setAskOpen(true);
//   }

//   return (
//     <div>
//       <Layout title="貼文管理" />
//       <div className="bankpage-wrapper bg-gray-100">
//         <div className="flex items-center gap-2">
//           <input
//               className="form-input w-56"
//               placeholder="搜尋標題、內容或作者"
//               value={query}
//               onChange={(e) => {
//                 setQuery(e.target.value);
//                 setPage(1);
//               }}
//             />
//           <StyledButton onClick={() => mutate()}>
//             重新載入
//           </StyledButton>
//         </div>

//         {/* Table */}
//         <div className="mt-4 bg-white rounded-xl shadow ring-1 ring-black/5 overflow-x-auto">
//           <table className="w-full table-fixed">
//             <thead className="text-sm text-gray-700 bg-gray-50 sticky top-0 z-10">
//               <tr>
//                 <th className="p-3 text-left w-[10%]">縮圖</th>
//                 <th className="p-3 text-left w-[20%]">標題</th>
//                 <th className="p-3 text-left w-[30%]">內容 (片段)</th>
//                 <th className="p-3 text-left w-[15%]">作者</th>
//                 <th className="p-3 text-left w-[10%]">狀態</th>
//                 <th className="p-3 text-left w-[15%]">操作</th>
//               </tr>
//             </thead>
//             <tbody>
//               {(() => {
//                 if (isLoading && !allItems) { // 僅在初次載入且無舊資料時顯示載入中
//                   return (
//                     <tr>
//                       <td colSpan="6" className="p-6 text-center">
//                         載入中...
//                       </td>
//                     </tr>
//                   );
//                 }
//                 if (error) {
//                   return (
//                     <tr>
//                       <td colSpan="6" className="p-6 text-center text-red-600">
//                         {error.message}
//                       </td>
//                     </tr>
//                   );
//                 }
//                 if (pageItems.length === 0) {
//                   return (
//                     <tr>
//                       <td colSpan="6" className="p-6 text-center">
//                         查無資料
//                       </td>
//                     </tr>
//                   );
//                 }
//                 return pageItems.map((item) => {
//                   const cover = getPostCoverImage(item.media);
//                   return (
//                     <tr key={item.id} className="border-t odd:bg-white even:bg-gray-50">
//                       <td className="p-3">
//                         {cover ? (
//                           <img
//                             src={cover}
//                             alt={item.title}
//                             className="w-16 h-16 object-cover rounded"
//                             loading="lazy"
//                             onError={(e) => {
//                               e.currentTarget.src = "/images/placeholder-96.png";
//                             }}
//                           />
//                         ) : (
//                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">無圖</div>
//                         )}
//                       </td>
//                       <td className="p-3 truncate font-medium">{item.title || '(無標題)'}</td>
//                       <td className="p-3 truncate text-sm text-gray-500">{item.content || '(無內容)'}</td>
//                       <td className="p-3 truncate text-sm">{item.author_name || item.user_id}</td>
//                       <td className="p-3">
//                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
//                            item.visibility === 'public' 
//                            ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20' 
//                            : 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20'
//                          }`}>
//                            {item.visibility}
//                          </span>
//                       </td>
//                       <td className="p-3">
//                         <div className="flex items-center gap-2">
//                           <button
//                             onClick={() => openAskModal(item.id)}
//                             className="px-2 py-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100"
//                             disabled={isDeleting}
//                           >
//                             刪除
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })()}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         <Page
//           page={page}
//           totalPages={totalPages}
//           gotoPage={gotoPage}
//           pageSize={pageSize}
//           setPageSize={setPageSize}
//           total={filtered.length}
//         />

//         <AskModal
//           open={askOpen}
//           title="刪除貼文"
//           message={`確定要刪除貼文 #${askTargetId}？此操作無法復原。`}
//           confirmText={isDeleting ? "刪除中..." : "刪除"}
//           cancelText="取消"
//           destructive={true}
//           onCancel={() => { setAskOpen(false); setAskTargetId(null); }}
//           onConfirm={() => { if (askTargetId) handleDeletePost(askTargetId); }}
//         />
//       </div>
//     </div>
//   );
// }