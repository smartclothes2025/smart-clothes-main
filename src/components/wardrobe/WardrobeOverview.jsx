// src/components/wardrobe/WardrobeOverview.jsx 
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import WardrobeItem from "./WardrobeItem";
import EditClothModal from "./EditClothModal";
import AskModal from "../AskModal";
import { useToast } from "../ToastProvider";
import useAllClothes from "../../hooks/useAllClothes"; // 引入 SWR Hook

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
const saveOutfits = (list) =>
  localStorage.setItem(OUTFIT_KEY, JSON.stringify(list));

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
    localStorage.setItem(
      `${OUTFIT_KEY}_last_update`,
      Date.now().toString()
    );
  } catch {}
};

const filters = [
  "全部",
  "上衣",
  "褲子",
  "裙子",
  "洋裝",
  "外套",
  "鞋子",
  "帽子",
  "包包",
  "配件",
  "襪子",
];

const API_BASE =
  import.meta?.env?.VITE_API_BASE ? import.meta.env.VITE_API_BASE : "/api/v1";
const API_ENDPOINT = `${API_BASE}/clothes`;

// 輔助函式：取得 JWT Token
function getToken() {
  return localStorage.getItem("token") || "";
}

export default function WardrobeOverview() {
  const INACTIVE_THRESHOLD = 90;
  const { addToast } = useToast();
  const navigate = useNavigate();

  // 使用 SWR Hook 獲取數據（無參數 = 目前登入使用者衣物）
  const {
    allItems: items,
    loading,
    error: fetchError,
    mutate,
  } = useAllClothes();

  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // 刪除相關
  const [askOpen, setAskOpen] = useState(false);
  const [askTargetId, setAskTargetId] = useState(null);
  const [batchAskOpen, setBatchAskOpen] = useState(false);

  // 刪除單一衣物（Optimistic Update）
  const deleteItem = useCallback(
    async (itemId) => {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // 1. 樂觀更新：先從前端移除
      const optimisticData = items.filter((item) => item.id !== itemId);
      mutate(optimisticData, {
        revalidate: false,
        populateCache: true,
        rollbackOnError: true,
      });

      try {
        // 2. 呼叫後端 DELETE
        const res = await fetch(`${API_ENDPOINT}/${itemId}`, {
          method: "DELETE",
          headers,
        });

        if (res.status === 204) {
          addToast({
            type: "success",
            title: "刪除成功",
            message: "該衣物已從衣櫃中移除。",
          });
          return true;
        } else if (res.status === 403) {
          addToast({
            type: "error",
            title: "權限不足",
            message: "您沒有權限刪除這件衣物。",
          });
        } else {
          const txt = await res.text().catch(() => "未知錯誤");
          addToast({
            type: "error",
            title: "刪除失敗",
            message: `後端錯誤：${res.status} ${txt}`,
          });
        }

        // 後端刪除失敗 → 回滾
        mutate(items);
        return false;
      } catch (error) {
        console.error("刪除錯誤:", error);
        addToast({
          type: "error",
          title: "網路錯誤",
          message: "無法連線到伺服器，刪除失敗。",
        });
        mutate(items);
        return false;
      }
    },
    [addToast, items, mutate]
  );

  function openAskModal(id) {
    setAskTargetId(id);
    setAskOpen(true);
  }

  function openBatchAskModal() {
    setBatchAskOpen(true);
  }

  async function handleConfirmBatchDelete() {
    setBatchAskOpen(false);
    try {
      for (const id of selectedIds.slice()) {
        // eslint-disable-next-line no-await-in-loop
        await deleteItem(id);
      }
    } finally {
      setSelecting(false);
      setSelectedIds([]);
    }
  }

  // 編輯成功後，局部更新 SWR 快取
  const handleEditSaved = (updated) => {
    const updatedItem = updated.item || updated;

    const newItems = items.map((it) => {
      if (String(it.id) !== String(updatedItem.id)) return it;
      return {
        ...it,
        ...updatedItem,
        name: updatedItem.name,
        category: updatedItem.category,
        color: updatedItem.color,
        img: updatedItem.img,
      };
    });

    mutate(newItems, { revalidate: false });
    addToast({ type: "success", title: "已更新衣物" });
  };

  const filteredItems = items.filter(
    (it) => activeFilter === "全部" || it.category === activeFilter
  );

  // ✅ 選取邏輯：禁止同類別重複 & 超過 3 件給提示
  const toggleSelect = (id) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;

    // 已選 → 取消選取
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      return;
    }

    const category = item.category;

    // 檢查已選取中是否有相同類別
    const hasSameCategory = selectedIds.some((selectedId) => {
      const other = items.find((it) => it.id === selectedId);
      return other && other.category === category;
    });

    if (hasSameCategory) {
      addToast({
        type: "error",
        title: "選取錯誤",
        message: `已經選取一件「${category}」，無法再選取多件相同類別的衣物。`,
      });
      return;
    }

    // 超過 3 件 → 提醒但允許
    if (selectedIds.length >= 3) {
      addToast({
        type: "warning",
        title: "選取衣物較多",
        message:
          "選擇超過 3 件衣物時，智慧助理比較容易出現臉部判斷錯誤，建議減少單次選取數量。",
      });
    }

    setSelectedIds((prev) => [...prev, id]);
  };

  const goToVirtualFitting = () => {
    if (selectedIds.length === 0) return;
    const selectedItems = items.filter((item) =>
      selectedIds.includes(item.id)
    );
    localStorage.setItem(
      "virtual_fitting_items",
      JSON.stringify(selectedItems)
    );
    navigate("/virtual-fitting");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              activeFilter === f
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                onClick={() => navigate("/upload/select")}
                className="px-3 py-1 text-sm rounded-md bg-gray-600 text-white"
              >
                新增衣物
              </button>
            </>
          ) : (
            <>
              {selectedIds.length > 0 && (
                <button
                  onClick={openBatchAskModal}
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
      {fetchError && <div className="py-2 text-red-600">{fetchError}</div>}

      {/* 空資料提示 */}
      {!loading && filteredItems.length === 0 && !fetchError ? (
        <div className="text-gray-500">
          目前衣櫃沒有衣服
          <br />
          請先確認是否有上傳衣服
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredItems.map((item) => (
            <WardrobeItem
              key={item.id}
              item={item}
              selecting={selecting}
              active={selectedIds.includes(item.id)}
              onToggle={() => toggleSelect(item.id)}
              onDelete={() => openAskModal(item.id)}
              inactiveThreshold={INACTIVE_THRESHOLD}
              onImageClick={(clicked) => {
                setEditItem(clicked);
                setEditOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* 編輯衣物 Modal */}
      <EditClothModal
        open={editOpen}
        item={editItem}
        onClose={() => {
          setEditOpen(false);
          setEditItem(null);
        }}
        apiBase={API_BASE}
        onSaved={handleEditSaved}
      />

      {/* 單筆刪除確認 */}
      <AskModal
        open={askOpen}
        title="刪除衣物"
        message="確定要刪除此衣物？"
        confirmText="刪除"
        cancelText="取消"
        destructive={true}
        onCancel={() => {
          setAskOpen(false);
          setAskTargetId(null);
        }}
        onConfirm={() => {
          if (askTargetId) {
            deleteItem(askTargetId);
            setAskOpen(false);
            setAskTargetId(null);
          }
        }}
      />

      {/* 多筆刪除確認 */}
      <AskModal
        open={batchAskOpen}
        title="刪除多筆衣物"
        message={`確定要刪除選中的 ${selectedIds.length} 件衣物嗎？`}
        confirmText="刪除"
        cancelText="取消"
        destructive={true}
        onCancel={() => {
          setBatchAskOpen(false);
        }}
        onConfirm={handleConfirmBatchDelete}
      />
    </div>
  );
}
