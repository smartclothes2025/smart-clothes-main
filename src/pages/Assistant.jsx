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

const STORAGE_PREFIX = "assistant:messages";
const LEGACY_STORAGE_KEY = "assistant:messages:v3";

const DEFAULT_MESSAGES = Object.freeze([
  {
    id: 1,
    role: "assistant",
    kind: "text",
    text: "嗨！我是你的穿搭小助手，有什麼穿搭建議都歡迎詢問我喔～",
  },
]);

const SHRINK_PX_DESKTOP = 20; 
const SHRINK_PX_MOBILE = 50;

const API_BASE =
  import.meta.env.VITE_API_BASE?.replace(/\/+$/, "") ||
  "https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1";

function getToken() {
  return localStorage.getItem("token") || "";
}
// ... (packMessages, restoreMessages 保持不變) ...
function getStorageKey(token) {
  return token ? `${STORAGE_PREFIX}:${token}` : `${STORAGE_PREFIX}:guest`;
}

function cloneDefaultMessages() {
  return DEFAULT_MESSAGES.map((m) => ({ ...m }));
}

function calculateNextId(list) {
  const maxId = list.reduce((mx, m) => Math.max(mx, m.id || 0), 0);
  return maxId + 1;
}

function formatAssistantText(text) {
  if (!text) return "";
  const parts = text.match(/[^。]*。|[^。]+/g);
  if (!parts) return text;
  return parts.map((part, index) => (
    <React.Fragment key={index}>
      {part.trim()}
      {index !== parts.length - 1 && <br />}
    </React.Fragment>
  ));
}

function createPendingImageEntry(file, dataUrl) {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  return {
    id,
    name: file.name || "image",
    size: file.size || 0,
    type: file.type || "",
    dataUrl,
  };
}

function packMessages(msgs) {
  return msgs.map((m) => {
    if (m.kind === "image") {
      const { id, role, kind, url, alt } = m;
      return { id, role, kind, url, alt: alt || "image" };
    }
    return { id: m.id, role: m.role, kind: "text", text: String(m.text ?? "") };
  });
}

function restoreMessages(token) {
  const candidateKeys = [getStorageKey(token), LEGACY_STORAGE_KEY];
  for (const key of candidateKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const arr = JSON.parse(raw);
      return arr.map((m) =>
        m.kind === "image"
          ? { id: m.id, role: m.role, kind: "image", url: m.url, alt: m.alt || "image" }
          : { id: m.id, role: m.role, kind: "text", text: m.text ?? "" }
      );
    } catch {
    }
  }
  return null;
}

export default function Assistant({ theme, setTheme }) {
  const [token, setToken] = useState(() => getToken());
  const initialMessages = restoreMessages(token) ?? cloneDefaultMessages();
  const [messages, setMessages] = useState(initialMessages);
  const nextIdRef = useRef(calculateNextId(initialMessages));
  const tokenRef = useRef(token);
  const fileInputRef = useRef(null);
  const [pendingImages, setPendingImages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const [cardHeightPx, setCardHeightPx] = useState(null);
  function computeCardHeightPx() {
    const rootFontSize =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    const headerEl = document.querySelector("header");
    const headerH = headerEl
      ? headerEl.getBoundingClientRect().height
      : 4 * rootFontSize;

    const layoutBottomNav = document.querySelector(".layout-bottom-nav"); 
    const bottomNavH = layoutBottomNav 
      ? layoutBottomNav.getBoundingClientRect().height 
      : 4 * rootFontSize; 

    const mobileExtraPx = isMobile ? bottomNavH : 0; 
    const vh = window.innerHeight;
    const shrinkPx = isMobile ? SHRINK_PX_MOBILE : SHRINK_PX_DESKTOP;
    const base = Math.floor(vh - headerH - mobileExtraPx) - shrinkPx;
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
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    const restored = restoreMessages(tokenRef.current);
    const base = restored ?? cloneDefaultMessages();
    setMessages(base);
    nextIdRef.current = calculateNextId(base);
  }, [token]);

  useEffect(() => {
    const key = getStorageKey(tokenRef.current);
    try {
      localStorage.setItem(key, JSON.stringify(packMessages(messages)));
      if (key !== LEGACY_STORAGE_KEY) {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    } catch (e) {
      console.warn("保存聊天暫存失敗：", e);
    }
  }, [messages, token]);

  useEffect(() => {
    const handleLogout = () => {
      const currentToken = tokenRef.current;
      try {
        localStorage.removeItem(getStorageKey(currentToken));
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch (e) {
        console.warn("清除聊天暫存失敗：", e);
      }
      const defaults = cloneDefaultMessages();
      setMessages(defaults);
      nextIdRef.current = calculateNextId(defaults);
      setToken("");
    };

    window.addEventListener("logout", handleLogout);
    return () => {
      window.removeEventListener("logout", handleLogout);
    };
  }, []);

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
    const hasText = txt.length > 0;
    const imagesToSend = pendingImages;
    const hasImages = imagesToSend.length > 0;
    if ((!hasText && !hasImages) || sending) return;

    const activeToken = getToken();
    if (!activeToken) {
      addMessage("assistant", "請先登入後再與小助手聊天。", "text");
      return;
    }

    if (activeToken !== tokenRef.current) {
      const restored = restoreMessages(activeToken) ?? cloneDefaultMessages();
      setMessages(restored);
      nextIdRef.current = calculateNextId(restored);
      setToken(activeToken);
    }

    setSending(true);
    if (hasText) addMessage("user", txt, "text");
    imagesToSend.forEach((img) => {
      addMessage("user", img.dataUrl, "image", { alt: img.name || "已上傳圖片" });
    });
    setInput("");
    setPendingImages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsTyping(true);

    try {
      const tokenToUse = tokenRef.current || getToken();
      if (!tokenToUse) throw new Error("未找到登入 Token，請先登入");

      const payload = {
        user_input: txt,
        images: imagesToSend.map((img) => img.dataUrl),
        image_names: imagesToSend.map((img) => img.name),
      };

      const res = await fetch(`${API_BASE}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenToUse}`,
        },
        body: JSON.stringify(payload),
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
    const files = Array.from(e.target.files || []).filter((f) => f.type?.startsWith("image/"));
    if (!files.length) return;

    const activeToken = getToken();
    if (!activeToken) {
      addMessage("assistant", "請先登入後再上傳圖片。", "text");
      e.target.value = "";
      return;
    }

    if (activeToken !== tokenRef.current) {
      const restored = restoreMessages(activeToken) ?? cloneDefaultMessages();
      setMessages(restored);
      nextIdRef.current = calculateNextId(restored);
      setToken(activeToken);
    }

    const readers = files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ dataUrl: reader.result, file });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers)
      .then((results) => {
        const entries = results
          .filter(({ dataUrl }) => typeof dataUrl === "string")
          .map(({ dataUrl, file }) => createPendingImageEntry(file, dataUrl));
        if (entries.length) {
          setPendingImages((prev) => [...prev, ...entries]);
        }
      })
      .catch((err) => {
        console.error("圖片讀取失敗", err);
        addMessage("assistant", "⚠️ 圖片讀取失敗，請重試", "text");
      });
  }

  function removePendingImage(id) {
    setPendingImages((prev) => prev.filter((item) => item.id !== id));
  }

  const quickPrompts = [
    "隨機推薦今日穿搭",
    "今天天氣適合穿什麼?",
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
        <div className="w-full mt-4 md:mt-0 px-1 md:px-0"> 
          {/* 聊天卡片 */}
          <div
            className="assistant-card bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col mx-auto max-w-5xl" // 【修正 3】：新增 max-w-5xl 限制寬度，並確保居中
            style={cardHeightPx ? { height: `${cardHeightPx}px` } : undefined}
          >
            {/* 快速提示區：調整顏色和陰影，使其更像卡片的一部分 */}
            <div
              className="px-4 pt-4 pb-3 border-b border-slate-100 bg-white/80 backdrop-blur flex flex-wrap gap-2 sticky top-0 z-10"
            >
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    setTimeout(() => handleSend(null), 0);
                  }}
                  // 優化快速提示按鈕樣式
                  className="px-3 py-1 rounded-full text-sm border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
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
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-lg font-semibold shadow-md">
                          <img src="/favicon-32x32.png"></img>
                        </div>
                      </div>
                    )}

                    {/* 訊息氣泡：優化圓角設計 */}
                    <div
                      className={`max-w-[70ch] break-words shadow-md transition-all duration-300 ${
                        isAssistant
                          ? "bg-slate-100 text-slate-800 rounded-2xl rounded-tl-sm px-2 py-3 text-left"
                          : "bg-slate-900 text-white rounded-2xl rounded-tr-sm px-2 py-3"
                      }`}
                    >
                      {m.kind === "image" ? (
                        <img
                          src={m.url}
                          alt={m.alt || "image"}
                          className="mt-1 w-full max-w-2xl rounded-xl shadow-lg" 
                        />
                      ) : (
                        isAssistant ? formatAssistantText(m.text) : m.text
                      )}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="mb-4 flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify中心 text-white text-lg font-semibold shadow-md">
                      <img src="/favicon-32x32.png"></img>
                    </div>
                  </div>
                  <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md">
                    <span className="typing-dot" />
                    <span className="typing-dot mx-1" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
            </div>

            {/* 輸入區 */}
            <div className="px-3 py-3 bg-white flex-shrink-0">
              {pendingImages.length > 0 && (
                <div className="mb-3 flex gap-3 overflow-x-auto pb-1">
                  {pendingImages.map((item) => (
                    <div key={item.id} className="relative flex-shrink-0">
                      <img
                        src={item.dataUrl}
                        alt={item.name || "已選擇圖片"}
                        className="h-20 w-20 object-cover rounded-lg border border-slate-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removePendingImage(item.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-700 text-white text-xs flex items-center justify-center shadow"
                        aria-label={`移除 ${item.name || "圖片"}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                {/* 輔助按鈕：相機 */}
                <button
                  type="button"
                  className="p-3 rounded-full hover:bg-slate-100 text-slate-500 transition-colors flex-shrink-0"
                  title="相機"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                  <CameraIcon className="w-6 h-6" />
                </button>
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