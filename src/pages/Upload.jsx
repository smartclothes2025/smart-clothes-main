// src/pages/Upload.jsx
import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useLocation, useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import Icon from "@mdi/react";
import { mdiUpload, mdiCloudUploadOutline, mdiChevronLeft, mdiChevronRight, mdiImageMultiple } from "@mdi/js";
import { useToast } from "../components/ToastProvider";

function getToken() {
  return localStorage.getItem("token") || "";
}

export default function Upload({ theme, setTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const [forms, setForms] = useState([]);
  const [files, setFiles] = useState([]);
  const [originalFiles, setOriginalFiles] = useState([]); // 保存原始檔案
  const [previewList, setPreviewList] = useState([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [removeBg, setRemoveBg] = useState(false);
  const [aiDetect, setAiDetect] = useState(false);
  const [aiResults, setAiResults] = useState([]); // AI 辨識結果
  const [uploading, setUploading] = useState(false);
  const [hasShownToast, setHasShownToast] = useState(false); // 追蹤是否已顯示 toast
  // 風格欄位不受限制，可以自由輸入任何文字

  useEffect(() => {
    if (!files.length) {
      setPreviewList([]);
      return;
    }
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewList(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  useEffect(() => {
    const st = location.state;
    if (st?.files && Array.isArray(st.files) && st.files.length) {
      setFiles(st.files);
      // 保存原始檔案（如果有的話）
      if (st?.originalFiles && Array.isArray(st.originalFiles)) {
        setOriginalFiles(st.originalFiles);
      } else {
        setOriginalFiles(st.files); // 如果沒有原始檔案，使用當前檔案
      }
      setPrimaryIndex(st.primaryIndex ?? 0);
      const p = Number.isInteger(st.primaryIndex)
        ? Math.min(Math.max(0, st.primaryIndex), st.files.length - 1)
        : 0;
      setCurrentIndex(p);
      
      // 如果有 AI 辨識結果，儲存起來
      if (st?.aiResults && Array.isArray(st.aiResults)) {
        setAiResults(st.aiResults);
      }
      
      // 根據 AI 結果初始化表單
      const initForms = st.files.map((file, index) => {
        const aiResult = st?.aiResults?.[index];
        
        // 類別對照表（英文 -> 中文）
        const categoryMap = {
          "tops": "上衣",
          "pants": "褲子",
          "skirts": "裙子",
          "dresses": "洋裝",
          "outerwear": "外套",
          "shoes": "鞋子",
          "bags": "包包",
          "hats": "帽子",
          "socks": "襪子",
          "jewelry": "配件",
          "special": "特殊",
          "bottoms": "下身",
          "pantsuits": "套裝"
        };
        
        if (aiResult) {
          // 使用 AI 辨識結果填入表單
          return {
            name: "",
            category: categoryMap[aiResult.category] || "上衣",
            color: aiResult.colors?.[0] || "",
            material: aiResult.material || "棉",
            style: aiResult.style || "休閒",
            size: aiResult.size || "M",
            brand: "",
          };
        } else {
          // 沒有 AI 結果，使用預設值
          return {
            name: "",
            category: "上衣",
            color: "",
            material: "棉",
            style: "休閒",
            size: "M",
            brand: "",
          };
        }
      });
      setForms(initForms);
    } else if (st?.file) {
      setFiles([st.file]);
      setPrimaryIndex(0);
      setCurrentIndex(0);
      setForms([
        {
          name: "",
          category: "上衣",
          color: "",
          material: "棉",
          style: "休閒",
          size: "M",
          brand: "",
        },
      ]);
    }
    // 從前一頁（UploadEdit）傳來的狀態來設定 Checkbox
    if (typeof st?.removeBg === "boolean") setRemoveBg(st.removeBg);
    if (typeof st?.aiDetect === "boolean") setAiDetect(st.aiDetect);
    
    // 如果有 AI 結果，顯示提示（只顯示一次）
    if (st?.aiResults && Array.isArray(st.aiResults) && !hasShownToast) {
      const successCount = st.aiResults.filter(r => r !== null).length;
      if (successCount > 0) {
        // 延遲顯示 toast，確保頁面已完全載入
        setTimeout(() => {
          addToast({ 
            type: 'info', 
            title: 'AI 辨識完成', 
            message: `已自動填入 ${successCount} 件衣物的 AI 建議資料，您可以修改後再上傳`
          });
          setHasShownToast(true); // 標記已顯示
        }, 300);
      }
    }
  }, [location.state]);

  function handleFileChange(e) {
    const list = Array.from(e.target.files || []);
    const imgs = list.filter((f) => f.type?.startsWith("image/"));
    if (!imgs.length) return;

    setFiles((prev) => {
      const merged = [...prev, ...imgs];
      if (prev.length === 0) setCurrentIndex(0);
      return merged;
    });

    setForms((prev) => {
      const newForms = imgs.map(() => ({
        name: "",
        category: "上衣",
        color: "",
        material: "棉",
        style: "休閒",
        size: "M",
        brand: "",
      }));
      return [...prev, ...newForms];
    });
  }

  function updateFormAt(index, patch) {
    setForms((prev) => {
      const copy = [...prev];
      copy[index] = { ...(copy[index] || {}), ...patch };
      return copy;
    });
  }

  function buildFormDataForIndex(idx) {
    const file = files[idx];
    const form = forms[idx] || {};
    const fd = new FormData();
    fd.append("file", file, file.name);
    
    // 如果使用者沒輸入 name，預設使用檔案名稱（不含副檔名）
    const fileStem = (file && file.name) ? file.name.replace(/\.[^/.]+$/, "") : "file";
    const nameVal = (form.name || "").toString().trim() || fileStem;
    fd.append("name", nameVal);
    
    fd.append("category", form.category || "上衣");
    fd.append("color", form.color || "");
    
    // style 不受限制，直接使用使用者輸入的值
    const styleValue = (form.style || "").trim();
    
    const tagsArr = [];
    if (styleValue) tagsArr.push(styleValue);
    if (form.brand) tagsArr.push(form.brand);
    
    // 將 style 直接加入 form data
    fd.append("style", styleValue);
    fd.append("tags", JSON.stringify(tagsArr));
    
    // 將 material, size, brand 放入 attributes 欄位
    const attrs = { 
        material: form.material || "", 
        size: form.size || "", 
        brand: form.brand || "" 
    };
    fd.append("attributes", JSON.stringify(attrs));
    
    // 傳遞給後端，控制是否執行 GCS 上傳前的去背邏輯
    fd.append("remove_bg", removeBg ? "1" : "0");
    fd.append("ai_detect", aiDetect ? "1" : "0");
    
    const token = getToken();
    if (token) fd.append("token", token);
    return fd;
  }

  async function performSingleUpload(fd) {
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    // 🎯 使用支援本地儲存的端點
    const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";
    const res = await fetch(`${API_BASE}/clothes`, { 
      method: "POST",
      headers,
      body: fd,
    });
    return res;
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    if (uploading) return;
    if (!files.length) {
      addToast({ type: "warning", title: "尚未選擇照片", message: "請先上傳照片再完成操作。" });
      return;
    }

    setUploading(true);
    const uploadedItems = []; // 儲存上傳成功的衣物名稱
    try {
      for (let i = 0; i < files.length; i++) {
        const fd = buildFormDataForIndex(i);
        const res = await performSingleUpload(fd);

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          let parsed = null;
          try {
            parsed = JSON.parse(text);
          } catch {}
          const errMsg = parsed?.detail || text || `${res.status} ${res.statusText}`;
          throw new Error(`第 ${i + 1} 件上傳失敗：${errMsg}`);
        }
        
        // 記錄上傳成功的衣物名稱
        const form = forms[i] || {};
        const file = files[i];
        const fileStem = (file && file.name) ? file.name.replace(/\.[^/.]+$/, "") : "file";
        const nameVal = (form.name || "").toString().trim() || fileStem;
        uploadedItems.push(nameVal);
      }

      // Toast 訊息
      const toastTitle = "上傳完成";
      const toastMessage = `成功上傳 ${files.length} 件衣物！`;
      
      // 顯示 Toast
      addToast({ type: "success", title: toastTitle, message: toastMessage, autoDismiss: 3000 });
      
  // 使用相同內容建立通知（儲存到通知中心 via toast-fired event）
  window.dispatchEvent(new CustomEvent('toast-fired', { detail: { id: `ui-${Date.now()}`, type: 'success', title: toastTitle, message: toastMessage, autoDismiss: 3000 } }));

      navigate("/upload/select");
    } catch (err) {
      console.error("upload error:", err);
      addToast({ type: "error", title: "上傳失敗", message: err.message || String(err), autoDismiss: 6000 });
    } finally {
      setUploading(false);
    }
  }

  function handleGoQuickAdd() {
    navigate("/quick-add");
  }
  function handleOpenEdit() {
    navigate("/upload/edit", { state: { files: files, primaryIndex, removeBg, aiDetect } });
  }

  return (
    <Layout title="新增衣物">
      <div className="page-wrapper">
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <div className="w-full mx-auto aspect-square bg-gray-50 rounded-lg overflow-hidden border border-dashed relative" style={{ maxHeight: 'min(100vw, 90vh)' }}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    aria-label="上傳照片"
                  />
                  {previewList.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 justify-center h-full p-6 pointer-events-none text-center">
                      <div className="rounded-full bg-white/80 p-4 shadow">
                        <Camera className="w-6 h-6 text-gray-700" />
                      </div>
                      <div className="text-sm text-gray-500">
                        尚未選擇照片<br />點擊方框或拖曳圖片來上傳
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => document.querySelector('input[type="file"]').click()}
                          className="px-3 py-2 rounded-lg border flex items-center gap-2 bg-white"
                        >
                          <Icon path={mdiUpload} size={0.9} />
                          <span className="text-sm">選擇圖片</span>
                        </button>

                        <button
                          type="button"
                          className="px-3 py-2 rounded-lg border"
                          onClick={() => navigate("/upload/select")}
                        >
                          重新上傳（編輯）
                        </button>
                      </div>
                    </div>
                  ) : (
                    <img src={previewList[currentIndex]} alt="preview" className="object-cover w-full h-full block bg-white" />
                  )}
                </div>

                {previewList.length > 1 && (
                  <div className="mt-2 p-2 rounded-lg bg-gray-100">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : previewList.length - 1))}
                        className="p-2 rounded-lg bg-white hover:bg-gray-50 transition shadow-sm"
                        title="上一張"
                      >
                        <Icon path={mdiChevronLeft} size={0.8} />
                      </button>
                      
                      <div className="flex-1 flex items-center justify-center gap-2">
                        <Icon path={mdiImageMultiple} size={0.8} className="text-gray-600" />
                        <span className="text-sm text-gray-700 whitespace-nowrap">
                          {currentIndex + 1} / {previewList.length}
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setCurrentIndex((prev) => (prev < previewList.length - 1 ? prev + 1 : 0))}
                        className="p-2 rounded-lg bg-white hover:bg-gray-50 transition shadow-sm"
                        title="下一張"
                      >
                        <Icon path={mdiChevronRight} size={0.8} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <aside className="rounded-xl p-3 backdrop-blur-md bg-white/30 border border-white/20 shadow-lg lg:sticky lg:top-4">
                <div className="mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 items-center">
                  <label className="text-sm text-gray-600">名稱</label>
                  <input
                    value={forms[currentIndex]?.name || ""}
                    onChange={(e) => updateFormAt(currentIndex, { name: e.target.value })}
                    className="p-2 border rounded-lg text-sm"
                    placeholder="例：白色T恤"
                  />

                  <label className="text-sm text-gray-600">類別</label>
                  <select
                    value={forms[currentIndex]?.category || "上衣"}
                    onChange={(e) => updateFormAt(currentIndex, { category: e.target.value })}
                    className="p-2 border rounded-lg text-sm"
                  >
                    <option>上衣</option>
                    <option>褲子</option>
                    <option>裙子</option>
                    <option>洋裝</option>
                    <option>外套</option>
                    <option>鞋子</option>
                    <option>帽子</option>
                    <option>包包</option>
                    <option>配件</option>
                    <option>襪子</option>
                  </select>

                  <label className="text-sm text-gray-600">顏色</label>
                  <input
                    value={forms[currentIndex]?.color || ""}
                    onChange={(e) => updateFormAt(currentIndex, { color: e.target.value })}
                    placeholder="顏色"
                    className="p-2 border rounded-lg text-sm"
                  />

                  <label className="text-sm text-gray-600">材質</label>
                  <input
                    value={forms[currentIndex]?.material || ""}
                    onChange={(e) => updateFormAt(currentIndex, { material: e.target.value })}
                    placeholder="材質"
                    className="p-2 border rounded-lg text-sm"
                  />

                  <label className="text-sm text-gray-600">風格</label>
                  <input
                    value={forms[currentIndex]?.style || ""}
                    onChange={(e) => updateFormAt(currentIndex, { style: e.target.value })}
                    placeholder="風格"
                    className="p-2 border rounded-lg text-sm"
                  />

                  <label className="text-sm text-gray-600">尺寸</label>
                  <input
                    value={forms[currentIndex]?.size || ""}
                    onChange={(e) => updateFormAt(currentIndex, { size: e.target.value })}
                    placeholder="尺寸"
                    className="p-2 border rounded-lg text-sm"
                  />

                  <label className="text-sm text-gray-600">品牌</label>
                  <input
                    value={forms[currentIndex]?.brand || ""}
                    onChange={(e) => updateFormAt(currentIndex, { brand: e.target.value })}
                    placeholder="品牌"
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>

                <div className="p-2 rounded-lg bg-white/5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/upload/edit", { state: { files: originalFiles.length > 0 ? originalFiles : files, primaryIndex, removeBg, aiDetect } })}
                    className="flex-1 flex items-center justify-center gap-1.5 border rounded-lg py-2.5 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <Icon path={mdiChevronLeft} size={0.9} />
                    <span className="text-sm">上一步</span>
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-black text-white rounded-lg py-2.5 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <span className="text-sm">{uploading ? "上傳中..." : "完成"}</span>
                    <Icon path={mdiCloudUploadOutline} size={0.9} />
                  </button>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}