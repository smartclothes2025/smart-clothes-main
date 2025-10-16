// src/components/wardrobe/WardrobeOverview.jsx
import React, { useEffect, useState } from "react";
import WardrobeItem from "./WardrobeItem";
import placeholderImg from "../../assets/t-shirt.png";

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
  // 觸發 storage 事件（其他 tab 可監聽）
  try {
    // 寫一個臨時 key 促發 storage event（大部分瀏覽器在同一 tab 不會觸發 storage，但跨 tab 會）
    localStorage.setItem(`${OUTFIT_KEY}_last_update`, Date.now().toString());
  } catch {}
};

const filters = ["全部", "上衣", "褲裝", "外套", "裙裝", "配飾"];
const API_BASE = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : "http://127.0.0.1:8000";

export default function WardrobeOverview() {
  const INACTIVE_THRESHOLD = 90;

  // 清掉舊的 items 緩存避免覆蓋（保留）
  useEffect(() => {
    try {
      localStorage.removeItem("wardrobe_items");
      localStorage.removeItem("wardrobe_items_seed");
    } catch {}
  }, []);

  const [items, setItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 選取相關 state
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        // 嘗試多個可能的 endpoint（不同部署或 router mount 位置）
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

        // 支援兩種格式：直接陣列或 { initialItems: [...] }
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.initialItems) ? data.initialItems : null);
        if (!arr) {
          throw new Error("API 回傳格式非預期（請檢查後端是否回傳陣列或 { initialItems: [...] }）");
        }

        const mapped = arr.map((it) => {
          let img = it.img || "";
          // 若 img 以 / 開頭，補上 API_BASE（避免跨域問題）
          if (img && img.startsWith("/")) {
            // 使用絕對主機路徑，但保留當前 API_BASE 的協定與 host
            img = `${API_BASE}${img}`;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在 mount 時抓一次

  const filteredItems = items.filter((it) => activeFilter === "全部" || it.category === activeFilter);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const createTodayOutfit = () => {
    if (selectedIds.length === 0) return;
    addOutfit({ clothesIds: selectedIds, note });
    setSelectedIds([]);
    setNote("");
    setSelecting(false);
    // 提示使用者
    alert("已加入今日穿搭！請到「穿搭」分頁查看。");
  };

  return (
    <div>
      {/* 篩選 + 操作列 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              activeFilter === f ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="今日穿搭備註（可留空）"
                className="border rounded-md px-2 py-1 text-sm"
              />
              <button
                onClick={createTodayOutfit}
                disabled={selectedIds.length === 0}
                className="px-3 py-1 text-sm rounded-md bg-green-600 text-white disabled:opacity-50"
              >
                加入今日穿搭（{selectedIds.length}）
              </button>
              <button
                onClick={() => {
                  setSelecting(false);
                  setSelectedIds([]);
                  setNote("");
                }}
                className="px-3 py-1 text-sm rounded-md bg-gray-200"
              >
                取消
              </button>
            </>
          )}
        </div>
      </div>

      {/* loading / error */}
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
