// src/pages/Assistant.jsx
import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import Layout from "../components/Layout";
import {
  PaperClipIcon,
  CameraIcon,
  MicrophoneIcon,
  ArrowUpCircleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const STORAGE_KEY = "assistant:messages:v3";

// 【修正 1】：大幅減少桌面版卡片高度縮減值，僅保留少量 padding 空間
// 目的：讓桌面版卡片盡可能高，只保留 Layout 上下邊距需要的空間。
const SHRINK_PX_DESKTOP = 20; // 從 140 減到 20
const SHRINK_PX_MOBILE = 50;

// API 基底：優先吃 .env 的 VITE_API_BASE，否則用 ngrok 後備
const API_BASE =
  import.meta.env.VITE_API_BASE?.replace(/\/+$/, "") ||
  "https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1";

function getToken() {
  return localStorage.getItem("token") || "";
}
// ... (packMessages, restoreMessages 保持不變) ...
function packMessages(msgs) {
  return msgs.map((m) => {
    if (m.kind === "image") {
      const { id, role, kind, url, alt } = m;
      return { id, role, kind, url, alt: alt || "image" };
    }
    return { id: m.id, role: m.role, kind: "text", text: String(m.text ?? "") };
  });
}

function restoreMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    return arr.map((m) =>
      m.kind === "image"
        ? { id: m.id, role: m.role, kind: "image", url: m.url, alt: m.alt || "image" }
        : { id: m.id, role: m.role, kind: "text", text: m.text ?? "" }
    );
  } catch {
    return null;
  }
}

export default function Assistant({ theme, setTheme }) {
  const restored = restoreMessages();
  const [messages, setMessages] = useState(
    restored ?? [
      {
        id: 1,
        role: "assistant",
        kind: "text",
        text: "嗨！我是你的穿搭小助手，有什麼穿搭建議都歡迎詢問我喔～",
      },
    ]
  );
  const nextIdRef = useRef(
    (restored?.reduce((mx, m) => Math.max(mx, m.id || 0), 1) ?? 1) + 1
  );

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);

  const scrollRef = useRef(null);

  // —— 卡片高度（依螢幕與 header 自適應 + 額外縮減）——
  const [cardHeightPx, setCardHeightPx] = useState(null);
  function computeCardHeightPx() {
    const rootFontSize =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    // 抓取 header
    const headerEl = document.querySelector("header");
    const headerH = headerEl
      ? headerEl.getBoundingClientRect().height
      : 4 * rootFontSize;
    
    // 抓取 Layout 底部導航欄
    const layoutBottomNav = document.querySelector(".layout-bottom-nav"); 
    const bottomNavH = layoutBottomNav 
      ? layoutBottomNav.getBoundingClientRect().height 
      : 4 * rootFontSize; // 預設底部導航欄高度
    

    // 行動版需要額外扣除底部導航欄高度
    const mobileExtraPx = isMobile ? bottomNavH : 0; 
    const vh = window.innerHeight;

    const shrinkPx = isMobile ? SHRINK_PX_MOBILE : SHRINK_PX_DESKTOP;
    
    // 計算最終高度
    const base = Math.floor(vh - headerH - mobileExtraPx) - shrinkPx;

    // 【修改 1 續】：讓卡片盡可能貼合底部
    return Math.max(isMobile ? 180 : 300, base);
  }
  useEffect(() => {
    const update = () => setCardHeightPx(computeCardHeightPx());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    let ro;
    const headerEl = document.querySelector("header");
    if (headerEl && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => update());
      ro.observe(headerEl);
    }
    // 監聽底部導航欄，如果存在
    const layoutBottomNav = document.querySelector(".layout-bottom-nav");
    let roBottom;
    if (layoutBottomNav && typeof ResizeObserver !== "undefined") {
        roBottom = new ResizeObserver(() => update());
        roBottom.observe(layoutBottomNav);
    }

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      if (ro && headerEl) ro.disconnect();
      if (roBottom && layoutBottomNav) roBottom.disconnect();
    };
  }, []);

  // 鎖 body 滾動，僅卡片內滾
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // 新訊息/打字中 → 捲到卡片底部
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() =>
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }) 
    );
    return () => cancelAnimationFrame(id);
  }, [messages, isTyping]);

  // 訊息變更 → 寫入暫存
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(packMessages(messages)));
    } catch (e) {
      console.warn("保存聊天暫存失敗：", e);
    }
  }, [messages]);

  // 新增訊息（text / image）
  function addMessage(role, content, kind = "text", extra = {}) {
    if (kind === "image") {
      setMessages((m) => [
        ...m,
        {
          id: nextIdRef.current++,
          role,
          kind: "image",
          url: content,
          alt: extra.alt || "image",
        },
      ]);
    } else {
      setMessages((m) => [
        ...m,
        {
          id: nextIdRef.current++,
          role,
          kind: "text",
          text: String(content ?? ""),
        },
      ]);
    }
  }

  async function handleSend(e) {
    e?.preventDefault();
    const txt = input.trim();
    if (!txt || sending) return;

    setSending(true);
    addMessage("user", txt, "text");
    setInput("");
    setIsTyping(true);

    try {
      const token = getToken();
      if (!token) throw new Error("未找到登入 Token，請先登入");

      const res = await fetch(`${API_BASE}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_input: txt }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`伺服器錯誤 ${res.status}: ${t}`);
      }

      const data = await res.json();

      if (data.type === "image") {
        if (data.text) addMessage("assistant", data.text, "text");
        if (data.url) addMessage("assistant", data.url, "image", { alt: "穿搭建議" });
        else addMessage("assistant", "⚠️ 圖片回覆缺少 URL。", "text");
      } else if (data.type === "text") {
        addMessage("assistant", data.text ?? "（空回覆）", "text");
      } else if (data.error) {
        addMessage("assistant", `⚠️ ${data.error}`, "text");
      } else {
        addMessage("assistant", "⚠️ 未知回應格式。", "text");
      }
    } catch (err) {
      addMessage("assistant", `🚨 連線或處理失敗：${err.message}`, "text");
    } finally {
      setIsTyping(false);
      setSending(false);
    }
  }

  function handleFileChange(e) {
    const list = Array.from(e.target.files || []);
    const imgs = list.filter((f) => f.type?.startsWith("image/"));
    if (!imgs.length) return;
    // 這裡只是個示範，實際應用中應處理圖片上傳邏輯
  }

  const quickPrompts = [
    "推薦今日穿搭",
    "正式場合穿搭建議",
    "雨天防水穿搭",
    "運動休閒穿搭",
  ];

  return (
    <Layout title="穿搭小助手">
      {/* 打字中動畫 */}
      <style>{`
        .typing-dot{display:inline-block;width:6px;height:6px;border-radius:9999px;background:#9aa0a6;opacity:.6;animation:typing 1s infinite}
        .typing-dot:nth-child(2){animation-delay:.12s}
        .typing-dot:nth-child(3){animation-delay:.24s}
        @keyframes typing{0%{transform:translateY(0)}50%{transform:translateY(-4px);opacity:1}100%{transform:translateY(0)}}
      `}</style>

      <div className="page-wrapper assistant-page">
        {/* 【修正 2】：移除桌機版的 mt-4，僅在行動版保留 px-3 */}
        <div className="w-full mt-4 md:mt-0 px-3 md:px-0"> 
          {/* 聊天卡片 */}
          <div
            className="assistant-card bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col mx-auto max-w-5xl" // 【修正 3】：新增 max-w-5xl 限制寬度，並確保居中
            style={cardHeightPx ? { height: `${cardHeightPx}px` } : undefined}
          >
            {/* 快速提示區：調整顏色和陰影，使其更像卡片的一部分 */}
            <div className="px-4 pt-4 pb-3 border-b border-slate-100 bg-white/80 backdrop-blur flex flex-wrap gap-2 sticky top-0 z-10">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    setTimeout(() => handleSend(null), 0);
                  }}
                  // 優化快速提示按鈕樣式
                  className="px-3 py-1 rounded-full text-sm border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* 訊息區 */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 bg-white" 
              aria-live="polite"
            >
              {messages.map((m) => {
                const isAssistant = m.role === "assistant";
                return (
                  <div
                    key={m.id}
                    className={`mb-4 flex ${
                      isAssistant ? "items-start" : "justify-end"
                    }`}
                  >
                    {/* 助手頭像：保持一致的圓角和顏色 */}
                    {isAssistant && (
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-lg font-semibold shadow-md">
                          🤖
                        </div>
                      </div>
                    )}

                    {/* 訊息氣泡：優化圓角設計 */}
                    <div
                      className={`max-w-[70ch] break-words shadow-md transition-all duration-300 ${
                        isAssistant
                          ? "bg-indigo-50 text-slate-800 rounded-2xl rounded-tl-sm px-4 py-3"
                          : "bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3"
                      }`}
                    >
                      {m.kind === "image" ? (
                        <img
                          src={m.url}
                          alt={m.alt || "image"}
                          className="mt-1 w-full max-w-2xl rounded-xl shadow-lg" 
                        />
                      ) : (
                        m.text
                      )}
                    </div>

                    {/* 用戶頭像：優化樣式，使用更鮮明的顏色並加入陰影 */}
                    {!isAssistant && (
                      <div className="flex-shrink-0 ml-3">
                        <div className="w-9 h-9 rounded-full bg-pink-500 flex items-center justify-center text-white text-lg font-semibold shadow-md">
                          U
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 打字中動畫：優化氣泡樣式與助手氣泡保持一致 */}
              {isTyping && (
                <div className="mb-4 flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-lg font-semibold shadow-md">
                      🤖
                    </div>
                  </div>
                  <div className="bg-indigo-50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md">
                    <span className="typing-dot" />
                    <span className="typing-dot mx-1" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
            </div>

            {/* 輸入區 */}
            <div className="px-3 py-3 bg-white flex-shrink-0">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                {/* 輔助按鈕：相機 */}
                <button
                  type="button"
                  className="p-3 rounded-full hover:bg-slate-100 text-slate-500 transition-colors flex-shrink-0"
                  title="相機"
                  onChange={handleFileChange}
                >
                  <CameraIcon className="w-6 h-6" />
                </button>
                {/* 語音輸入按鈕 (為了保持和上次的輸出一致，這裡暫時將 MicrophoneIcon 移除) */}
                
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) handleSend(e);
                  }}
                  placeholder="你可以問各種穿搭建議"
                  className="flex-1 rounded-full px-4 py-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-shadow text-base"
                />

                {/* 送出按鈕 */}
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className={`p-3 rounded-full text-white transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed flex-shrink-0 ${ 
                    sending ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                  title="送出"
                >
                  <ArrowUpCircleIcon className="w-6 h-6 rotate-90" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

Assistant.propTypes = {
  theme: PropTypes.string.isRequired,
  setTheme: PropTypes.func.isRequired,
};