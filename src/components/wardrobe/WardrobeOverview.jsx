import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import WardrobeItem from "./WardrobeItem";
import EditClothModal from "./EditClothModal";
import AskModal from "../AskModal";
import { useToast } from "../ToastProvider"; // 引入 Toast

const OUTFIT_KEY = "outfit_history";
// 輔助函式：取得歷史穿搭 (保持不變)
const getOutfits = () => {
  try {
    return JSON.parse(localStorage.getItem(OUTFIT_KEY)) || [];
  } catch {
    return [];
  }
};
// 輔助函式：儲存歷史穿搭 (保持不變)
const saveOutfits = (list) => localStorage.setItem(OUTFIT_KEY, JSON.stringify(list));
// 輔助函式：新增歷史穿搭 (保持不變)
const addOutfit = ({ clothesIds = [], note = "", img = "" }) => {
  const list = getOutfits();
  const today = new Date().toISOString().slice(0, 10);
  list.push({
    id: Date.now(),
    date: today,
    clothesIds,
    note: note || "無備註",
    img: img || "/default-outfit.png",
  });
  saveOutfits(list);
  try {
    localStorage.setItem(`${OUTFIT_KEY}_last_update`, Date.now().toString());
  } catch { }
};

const filters = ["全部", "上衣", "褲子", "裙子", "洋裝", "外套", "鞋子", "帽子", "包包", "配件", "襪子"];
const API_BASE = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : ""; // use relative paths by default to enable Vite proxy

// 輔助函式：取得 JWT Token
function getToken() {
  return localStorage.getItem("token") || "";
}

export default function WardrobeOverview() {
  const INACTIVE_THRESHOLD = 90;
  const { addToast } = useToast(); // 初始化 Toast

  useEffect(() => {
    // 啟動時清理本地舊的測試數據
    try {
      localStorage.removeItem("wardrobe_items");
      localStorage.removeItem("wardrobe_items_seed");
    } catch { }
  }, []);

  const [items, setItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const navigate = useNavigate();

  // --- 數據載入邏輯 ---
  const fetchWardrobe = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    const token = getToken();
    
    // 訪客帳號檢查
    let storedUser = null;
    try {
      const u = localStorage.getItem('user');
      storedUser = u ? JSON.parse(u) : null;
    } catch (e) {
      storedUser = null;
    }
    const isGuest = token === 'guest-token-000' || storedUser?.id === 99 || storedUser?.name === '訪客' || storedUser?.email === 'guest@local';
    
    if (isGuest) {
      setItems([]);
      setError('訪客無法查看衣櫃，請用註冊帳號或其他使用者登入');
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    
    // 🎯 修正後的 API 呼叫：統一且確定的路由
    const URL = `${API_BASE}/clothes`; 
    
    try {
        const res = await fetch(URL, { method: "GET", headers, signal });
        
        if (res.status === 404) {
             throw new Error(`獲取衣物清單失敗: 後端路由 ${URL} 找不到 (404)`);
        }
        
        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            console.error('[wardrobe] fetch failed', res.status, txt);
            throw new Error(`獲取衣物清單失敗: ${res.statusText}`);
        }
        
        const data = await res.json();
        
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.initialItems) ? data.initialItems : null);
        if (!arr) {
          throw new Error("API 回傳格式非預期（請檢查後端是否回傳陣列或 { initialItems: [...] }）");
        }

        // GCS 圖片處理：後端已返回 HTTPS 網址，前端只需簡單處理 URL
        const mapped = arr.map((it) => {
    // 優先使用 item.cover_url (如果後端有提供)
    let rawUrl = it.cover_url || it.img || ""; 
    let finalImgUrl = rawUrl;

    // 🎯 修正：處理被錯誤拼接的 GCS URL
    // 檢查是否有常見的錯誤拼接前綴
    const localErrorPrefix = 'http://localhost:5173/';
    
    if (finalImgUrl && finalImgUrl.startsWith(localErrorPrefix)) {
        // 如果是 GCS URL 被錯誤拼接了本地 host，移除本地 host
        if (finalImgUrl.includes('https://storage.googleapis.com/')) {
             finalImgUrl = finalImgUrl.substring(localErrorPrefix.length);
             console.warn(`[ParentComponent] ⚠️ 修正 GCS URL 重複拼接: ${finalImgUrl}`);
        }
    }
    
    // 由於後端 resolve_image_url 已經返回完整的 HTTPS 網址，這裡只需確保非空
    return {
        id: Number.isInteger(+it.id) ? +it.id : it.id,
        name: it.name || "",
        category: it.category || "",
        wearCount: it.wearCount || 0,
        // 確保 img 欄位使用修正後的 URL
        img: finalImgUrl || '/default-placeholder.png', 
        daysInactive: typeof it.daysInactive === "number" ? it.daysInactive : null,
        color: it.color || "",
    };
});

setItems(mapped);

    } catch (err) {
        if (err && err.name === "AbortError") return;
        console.warn("載入衣櫃失敗:", err);
        setError(err.message || "無法載入衣櫃，請確認後端或網路連線");
        setItems([]);
    } finally {
        setLoading(false);
    }
  }, [API_BASE, addToast]);

  useEffect(() => {
    const controller = new AbortController();
    fetchWardrobe(controller.signal);
    return () => controller.abort();
  }, [fetchWardrobe]);

  // --- 新增刪除衣物功能 ---
  const [askOpen, setAskOpen] = useState(false);
  const [askTargetId, setAskTargetId] = useState(null);
  const [batchAskOpen, setBatchAskOpen] = useState(false);

  const deleteItem = useCallback(async (itemId) => {
  setLoading(true);
  const token = getToken();
  const headers = { Authorization: `Bearer ${token}` };

  try {
    // 🎯 呼叫後端 DELETE 路由: /api/v1/clothes/{itemId}
    const res = await fetch(`${API_BASE}/clothes/${itemId}`, {
      method: "DELETE",
      headers,
    });

    if (res.status === 204) { // 204 No Content 是成功的回應
      addToast({ type: 'success', title: '刪除成功', message: '該衣物已從衣櫃中移除。' });
      // 從本地狀態中移除
      setItems(prev => prev.filter(item => item.id !== itemId));
    } else if (res.status === 403) {
       addToast({ type: 'error', title: '權限不足', message: '您沒有權限刪除這件衣物。' });
    } else {
      const txt = await res.text().catch(() => "未知錯誤");
      addToast({ type: 'error', title: '刪除失敗', message: `後端錯誤：${res.status} ${txt}` });
    }

  } catch (error) {
    console.error("刪除錯誤:", error);
    addToast({ type: 'error', title: '網路錯誤', message: '無法連線到伺服器，刪除失敗。' });
  } finally {
    setLoading(false);
  }
  }, [API_BASE, addToast]);

  function openAskModal(id) {
  setAskTargetId(id);
  setAskOpen(true);
  }

  function openBatchAskModal() {
    setBatchAskOpen(true);
  }

  async function handleConfirmBatchDelete() {
    // 關閉 modal 並逐一刪除選取項目
    setBatchAskOpen(false);
    try {
      for (const id of selectedIds.slice()) {
        // 等待每個刪除完成以避免同時改變狀態衝突
        // deleteItem 會處理錯誤與 toast
        // eslint-disable-next-line no-await-in-loop
        await deleteItem(id);
      }
    } finally {
      setSelecting(false);
      setSelectedIds([]);
    }
  }
  // -----------------------

  const filteredItems = items.filter((it) => activeFilter === "全部" || it.category === activeFilter);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const goToVirtualFitting = () => {
    if (selectedIds.length === 0) return;
    const selectedItems = items.filter(item => selectedIds.includes(item.id));
    localStorage.setItem('virtual_fitting_items', JSON.stringify(selectedItems));
    navigate('/virtual-fitting');
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${activeFilter === f ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {f}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {!selecting ? (
            <>
                <button 
                    onClick={() => setSelecting(true)} 
                    className="px-3 py-1 text-sm rounded-md bg-indigo-600 text-white"
                >
                  選取衣服
                </button>
                 <button 
                    onClick={() => navigate('/upload/select')} 
                    className="px-3 py-1 text-sm rounded-md bg-gray-600 text-white"
                >
                  新增衣物
                </button>
            </>
          ) : (
            <>
              {selectedIds.length > 0 && (
                <button
                    onClick={() => openBatchAskModal()}
                    className="px-3 py-1 text-sm rounded-md bg-red-600 text-white disabled:opacity-50"
                >
                    刪除（{selectedIds.length}）
                </button>
              )}
              
              <button
                onClick={goToVirtualFitting}
                disabled={selectedIds.length === 0}
                className="px-3 py-1 text-sm rounded-md bg-green-600 text-white disabled:opacity-50"
              >
                虛擬試衣（{selectedIds.length}）
              </button>
              <button
                onClick={() => {
                  setSelecting(false);
                  setSelectedIds([]);
                }}
                className="px-3 py-1 text-sm rounded-md bg-gray-200"
              >
                取消
              </button>
            </>
          )}
        </div>
      </div>

      {loading && <div className="py-6 text-gray-500">載入中…</div>}
      {error && <div className="py-2 text-red-600">{error}</div>}

      {/* 空資料提示 */}
      {!loading && filteredItems.length === 0 ? (
        <div className="text-gray-500">目前衣櫃沒有衣服<br />請先確認是否有上傳衣服</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredItems.map((item) => (
            <WardrobeItem
              key={item.id}
              item={item}
              selecting={selecting}
              active={selectedIds.includes(item.id)}
              onToggle={() => toggleSelect(item.id)}
              // 使用 onDelete 由父元件觸發 AskModal
              onDelete={() => openAskModal(item.id)}
              inactiveThreshold={INACTIVE_THRESHOLD}
                      onImageClick={(clicked) => { setEditItem(clicked); setEditOpen(true); }}
            />
          ))}
        </div>
      )}
              {/* 編輯衣物 Modal */}
              <EditClothModal
                open={editOpen}
                item={editItem}
                onClose={() => { setEditOpen(false); setEditItem(null); }}
                apiBase={API_BASE}
                onSaved={(updated) => {
                  setItems(prev => prev.map(it => it.id === updated.id ? { ...it, ...updated } : it));
                  addToast({ type: 'success', title: '已更新衣物' });
                }}
              />
      <AskModal
        open={askOpen}
        title="刪除衣物"
        message="確定要刪除此衣物？"
        confirmText="刪除"
        cancelText="取消"
        destructive={true}
        onCancel={() => { setAskOpen(false); setAskTargetId(null); }}
        onConfirm={() => { if (askTargetId) { deleteItem(askTargetId); setAskOpen(false); setAskTargetId(null); } }}
      />
      <AskModal
        open={batchAskOpen}
        title="刪除多筆衣物"
        message={`確定要刪除選中的 ${selectedIds.length} 件衣物嗎？`}
        confirmText="刪除"
        cancelText="取消"
        destructive={true}
        onCancel={() => { setBatchAskOpen(false); }}
        onConfirm={() => { handleConfirmBatchDelete(); }}
      />
    </div>
  );
}