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
  BellIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

/* =========================
   設定區
========================= */
// 儲存聊天紀錄的 key（有變更資料結構時記得+1）
const STORAGE_KEY = "assistant:messages:v3";

// 卡片高度額外縮減（越大=越矮）
const SHRINK_PX_DESKTOP = 140;
const SHRINK_PX_MOBILE = 120;

// API 基底：優先吃 .env 的 VITE_API_BASE，否則用 ngrok 後備
const API_BASE =
  import.meta.env.VITE_API_BASE?.replace(/\/+$/, "") ||
  "https://cometical-kyphotic-deborah.ngrok-free.dev/api/v1";

function getToken() {
  return localStorage.getItem("token") || "";
}

/* =========================
   序列化工具（localStorage 用）
========================= */
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

/* =========================
   主元件
========================= */
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

    const headerEl = document.querySelector("header");
    const headerH = headerEl
      ? headerEl.getBoundingClientRect().height
      : 4 * rootFontSize;

    const mobileExtraPx = 10 * rootFontSize;
    const vh = window.innerHeight;

    const base = isMobile
      ? Math.floor(vh - mobileExtraPx) - SHRINK_PX_MOBILE
      : Math.floor(vh - headerH) - SHRINK_PX_DESKTOP;

    return Math.max(isMobile ? 220 : 300, base);
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
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      if (ro && headerEl) ro.disconnect();
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
      el.scrollTo({ top: el.scrollHeight, behavior: "auto" })
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

      <div className="page-wrapper">
        <div className="max-w-5xl mx-auto mt-2 px-2 md:px-0">
          {/* 頂部列 */}
          <header className="flex items-center justify-between bg-white/70 backdrop-blur rounded-xl px-4 py-3 shadow-sm mb-2">
            <div className="flex items-center gap-2 text-slate-800">
              <span className="text-xl">🧥</span>
              <h1 className="font-semibold">穿搭小助手</h1>
              <span className="ml-2 text-xs text-slate-500 hidden sm:block">
                Beta
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <ClockIcon className="w-5 h-5" />
              <BellIcon className="w-5 h-5" />
              <Cog6ToothIcon className="w-5 h-5" />
            </div>
          </header>

          {/* 聊天卡片 */}
          <div
            className="assistant-card bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col"
            style={cardHeightPx ? { height: `${cardHeightPx}px` } : undefined}
          >
            {/* 建議捷徑 */}
            <div className="px-4 pt-4 pb-2 border-b bg-white/60 backdrop-blur flex flex-wrap gap-2">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    setTimeout(() => handleSend(null), 0);
                  }}
                  className="px-3 py-1 rounded-full text-sm border border-slate-200 hover:bg-slate-50"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* 訊息區 */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 bg-slate-50"
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
                    {isAssistant && (
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                          🤖
                        </div>
                      </div>
                    )}

                    <div
                      className={`px-4 py-2 max-w-[70ch] break-words ${
                        isAssistant
                          ? "bg-white text-slate-800 rounded-xl rounded-tl-none border border-slate-200"
                          : "bg-indigo-600 text-white rounded-xl rounded-tr-none shadow"
                      }`}
                    >
                      {m.kind === "image" ? (
                        <img
                          src={m.url}
                          alt={m.alt || "image"}
                          className="mt-1 w-full max-w-2xl rounded-xl shadow"
                        />
                      ) : (
                        m.text
                      )}
                    </div>

                    {!isAssistant && (
                      <div className="flex-shrink-0 ml-3">
                        <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-700">
                          U
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {isTyping && (
                <div className="mb-4 flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      🤖
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl rounded-tl-none px-4 py-2">
                    <span className="typing-dot" />
                    <span className="typing-dot mx-1" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
            </div>

            {/* 底部輸入工具列 */}
            <div className="border-t px-3 py-3 bg-white flex-shrink-0">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-slate-100"
                  title="附加檔案"
                >
                  <PaperClipIcon className="w-5 h-5 text-slate-600" />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-slate-100"
                  title="相機"
                >
                  <CameraIcon className="w-5 h-5 text-slate-600" />
                </button>

                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) handleSend(e);
                  }}
                  placeholder="在這裡輸入，你可以問各種穿搭建議"
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />

                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-slate-100"
                  title="語音輸入"
                >
                  <MicrophoneIcon className="w-5 h-5 text-slate-600" />
                </button>

                <button
                  type="submit"
                  disabled={sending}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl text-white ${
                    sending
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                  title="送出"
                >
                  <ArrowUpCircleIcon className="w-5 h-5" />
                  <span>{sending ? "傳送中…" : "送出"}</span>
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
