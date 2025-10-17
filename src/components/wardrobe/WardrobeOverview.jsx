// src/components/wardrobe/WardrobeOverview.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WardrobeItem from "./WardrobeItem";

const OUTFIT_KEY = "outfit_history";
const getOutfits = () => {
  try {
    return JSON.parse(localStorage.getItem(OUTFIT_KEY)) || [];
  } catch {
    return [];
  }
};
const saveOutfits = (list) => localStorage.setItem(OUTFIT_KEY, JSON.stringify(list));
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
const API_BASE = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : "http://127.0.0.1:8000";

export default function WardrobeOverview() {
  const INACTIVE_THRESHOLD = 90;

  useEffect(() => {
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
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        // 若為訪客帳號則不顯示衣物
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
        const candidates = [
          `${API_BASE}/api/v1/wardrobe/clothes`,
          `${API_BASE}/api/v1/clothes`,
          `${API_BASE}/wardrobe/clothes`,
          `${API_BASE}/clothes`,
          `/api/v1/wardrobe/clothes`,
          `/api/v1/clothes`,
          `/wardrobe/clothes`,
          `/clothes`,
        ];

        let data = null;
        let lastInfo = null;
        for (const url of candidates) {
          try {
            const res = await fetch(url, { method: "GET", headers, signal: controller.signal });
            if (!res.ok) {
              const txt = await res.text().catch(() => "");
              lastInfo = { url, status: res.status, text: txt };
              console.warn('[wardrobe] candidate failed', url, res.status, txt);
              continue;
            }
            data = await res.json();
            console.info('[wardrobe] fetched from', url);
            break;
          } catch (err) {
            if (err && err.name === 'AbortError') throw err;
            console.warn('[wardrobe] candidate error', url, err);
            lastInfo = err;
          }
        }

        if (!data) {
          throw new Error(`fetch failed (all candidates) ${JSON.stringify(lastInfo)}`);
        }

        const arr = Array.isArray(data) ? data : (Array.isArray(data?.initialItems) ? data.initialItems : null);
        if (!arr) {
          throw new Error("API 回傳格式非預期（請檢查後端是否回傳陣列或 { initialItems: [...] }）");
        }

        const mapped = arr.map((it) => {
          let img = it.img || "";
          // 若為完整 URL 就直接使用
          if (img && (img.startsWith("http://") || img.startsWith("https://"))) {
            // leave as-is
          } else {
            // 移除可能被夾帶的後端路由前綴 /api/v1
            if (img.startsWith("/api/v1")) img = img.replace(/^\/api\/v1/, "");
            // 若 img 以 / 開頭，補上 API_BASE（避免跨域問題）
            if (img && img.startsWith("/")) {
              img = `${API_BASE}${img}`;
            } else {
              // 非絕對也非以 / 開頭的相對路徑，視為 uploads 內的檔案
              const rel = img.startsWith("uploads") ? `/${img}` : `/uploads/${img}`;
              img = `${API_BASE}${rel}`;
            }
          }
          return {
            id: Number.isInteger(+it.id) ? +it.id : it.id,
            name: it.name || "",
            category: it.category || "",
            wearCount: it.wearCount || 0,
            img: img || placeholderImg,
            daysInactive: typeof it.daysInactive === "number" ? it.daysInactive : null,
            color: it.color || "",
          };
        });

        setItems(mapped);
      } catch (err) {
        if (err && err.name === "AbortError") return;
        console.warn("載入衣櫃失敗:", err);
        setError("無法載入衣櫃，請確認後端或網路連線");
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const filteredItems = items.filter((it) => activeFilter === "全部" || it.category === activeFilter);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const goToVirtualFitting = () => {
    if (selectedIds.length === 0) return;
    // 將選中的單品 ID 存到 localStorage，然後導航到虛擬試衣頁面
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
            <button onClick={() => setSelecting(true)} className="px-3 py-1 text-sm rounded-md bg-indigo-600 text-white">
              選取單品
            </button>
          ) : (
            <>
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
        <div className="text-gray-500">目前衣櫃沒有單品。請先上傳衣物或確認後端資料庫是否有資料。</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <WardrobeItem
              key={item.id}
              item={item}
              selecting={selecting}
              active={selectedIds.includes(item.id)}
              onToggle={() => toggleSelect(item.id)}
              inactiveThreshold={INACTIVE_THRESHOLD}
            />
          ))}
        </div>
      )}
    </div>
  );
}
