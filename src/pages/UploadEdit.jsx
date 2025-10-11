// src/pages/UploadEdit.jsx
import React, { useEffect, useRef, useState } from "react";
import Icon from "@mdi/react";
import { mdiInformationSlabCircleOutline } from "@mdi/js";
import Cropper from "react-easy-crop";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function UploadEdit({ theme, setTheme }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const srcFile = state?.file || null;
  const srcFiles = state?.files || (srcFile ? [srcFile] : []);

  const imgRef = useRef(null);
  const cropWrapRef = useRef(null);
  const [previewUrls, setPreviewUrls] = useState([]); // per-image preview urls
  const [currentIndex, setCurrentIndex] = useState(0);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [removeBg, setRemoveBg] = useState(true);
  const [aiDetect, setAiDetect] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showAIDesc, setShowAIDesc] = useState(false);
  // per-image states
  const [rotateArr, setRotateArr] = useState([]); // degree per image
  const [fitArr, setFitArr] = useState([]); // 'free' | 'cover' per image
  const [cropModeArr, setCropModeArr] = useState([]);
  const [cropArr, setCropArr] = useState([]);
  const [zoomArr, setZoomArr] = useState([]);
  const [croppedAreaPixelsArr, setCroppedAreaPixelsArr] = useState([]);
  // 永遠顯示格線
  const showGrid = true;
  const [mediaSizeArr, setMediaSizeArr] = useState([]);
  const [minZoomArr, setMinZoomArr] = useState([]); // per-image minZoom to avoid gaps
  const [viewportSide, setViewportSide] = useState(0); // square side of the viewport

  // 監聽容器大小，讓 cropSize 填滿正方形容器
  useEffect(() => {
    const wrap = cropWrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => {
      const side = Math.min(wrap.clientWidth || 0, wrap.clientHeight || 0);
      setViewportSide(side);
    });
    ro.observe(wrap);
    // 初始設置
    const side = Math.min(wrap.clientWidth || 0, wrap.clientHeight || 0);
    setViewportSide(side);
    return () => ro.disconnect();
  }, []);

  // 計算 cover/contain 需用的 zoom 值
  const computeCoverZoom = (viewportW, viewportH, ms) => {
    return Math.max(viewportW / ms.width, viewportH / ms.height);
  };
  const computeContainZoom = (viewportW, viewportH, ms) => {
    return Math.min(viewportW / ms.width, viewportH / ms.height);
  };

  // 設定為「滿版 cover」的縮放
  const applyCoverZoom = (ms, index = currentIndex) => {
    const wrap = cropWrapRef.current;
    if (!wrap || !ms.width || !ms.height) return;
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    const coverZoom = computeCoverZoom(cw, ch, ms);
    setZoomArr((prev) => {
      const arr = prev.slice();
      arr[index] = coverZoom;
      return arr;
    });
    setCropArr((prev) => {
      const arr = prev.slice();
      arr[index] = { x: 0, y: 0 };
      return arr;
    });
    setMinZoomArr((prev) => { const arr = prev.slice(); arr[index] = coverZoom; return arr; });
  };

  // 設定為「置中 contain」的縮放
  const applyContainZoom = (ms, index = currentIndex) => {
    const wrap = cropWrapRef.current;
    if (!wrap || !ms.width || !ms.height) return;
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    const containZoom = computeContainZoom(cw, ch, ms);
    setZoomArr((prev) => {
      const arr = prev.slice();
      arr[index] = containZoom;
      return arr;
    });
    setCropArr((prev) => {
      const arr = prev.slice();
      arr[index] = { x: 0, y: 0 };
      return arr;
    });
    setMinZoomArr((prev) => { const arr = prev.slice(); arr[index] = containZoom; return arr; });
  };

  // 工具：載入圖片、角度與旋轉後尺寸、裁切出圖（支援旋轉）
  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener("load", () => resolve(img));
      img.addEventListener("error", (e) => reject(e));
      img.setAttribute("crossOrigin", "anonymous");
      img.src = url;
    });

  const getRadianAngle = (deg) => (deg * Math.PI) / 180;

  const rotateSize = (width, height, rotation) => {
    const rotRad = getRadianAngle(rotation);
    return {
      width:
        Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height:
        Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };

  async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
    const image = await createImage(imageSrc);
    const rotRad = getRadianAngle(rotation);

    // 建立一個足以容納旋轉後影像的畫布
    const { width: bBoxW, height: bBoxH } = rotateSize(
      image.width,
      image.height,
      rotation
    );

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = bBoxW;
    canvas.height = bBoxH;

    // 先把來源圖 rotate 到畫布中央
    ctx.translate(bBoxW / 2, bBoxH / 2);
    ctx.rotate(rotRad);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);

    // 依裁切區域再取出目標區塊
    const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);

    // 產生最終輸出畫布（正好等於裁切大小）
    const outCanvas = document.createElement("canvas");
    outCanvas.width = pixelCrop.width;
    outCanvas.height = pixelCrop.height;
    const outCtx = outCanvas.getContext("2d");
    outCtx.fillStyle = "#ffffff";
    outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);
    outCtx.putImageData(data, 0, 0);

    const blob = await new Promise((res) => outCanvas.toBlob(res, "image/jpeg", 0.92));
    return blob;
  }

  useEffect(() => {
    if (!srcFiles.length) return;
    const urls = srcFiles.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    // init per-image states
    const n = srcFiles.length;
    setRotateArr(Array(n).fill(0));
    setFitArr(Array(n).fill("free"));
    setCropModeArr(Array(n).fill(true));
    setCropArr(Array(n).fill({ x: 0, y: 0 }));
    setZoomArr(Array(n).fill(1));
    setCroppedAreaPixelsArr(Array(n).fill(null));
    setMediaSizeArr(Array(n).fill({ width: 0, height: 0 }));
    setCurrentIndex(0);
    setPrimaryIndex(0);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [srcFiles]);

  if (!srcFiles.length) {
    return (
      <div className="min-h-full pb-24 pt-2 md:pb-0 px-2">
        <Header title="編輯照片"/>
        <div className="lg:pl-72">
          <div className="max-w-xl mx-auto p-6 text-center text-gray-500">
            找不到圖片來源，請重新選擇。
            <div className="mt-4">
              <button
                className="px-4 py-2 rounded-lg border"
                onClick={() => navigate("/upload/select")}
              >
                返回選擇
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function handleNext() {
    // 若在裁切模式，使用旋轉裁切輸出
    const editedFiles = [];
    for (let i = 0; i < srcFiles.length; i++) {
      const pv = previewUrls[i];
      const rot = rotateArr[i] || 0;
      const cap = croppedAreaPixelsArr[i];
      
      // 如果該圖片尚未被載入過（沒有 croppedAreaPixels），先載入取得原始尺寸
      let cropPixels = cap;
      if (!cropPixels) {
        // 載入圖片取得原始尺寸
        try {
          const img = await createImage(pv);
          cropPixels = { x: 0, y: 0, width: img.width, height: img.height };
        } catch (err) {
          console.error(`無法載入第 ${i+1} 張圖片`, err);
          alert(`第 ${i+1} 張圖片載入失敗，請重試。`);
          return;
        }
      }
      
      const blob = await getCroppedImg(pv, {
        x: Math.round(cropPixels.x),
        y: Math.round(cropPixels.y),
        width: Math.round(cropPixels.width),
        height: Math.round(cropPixels.height),
      }, rot);
      const baseName = srcFiles[i].name?.replace(/\.[^.]+$/, "") || `image_${i+1}`;
      const file = new File([blob], `${baseName}_edited.jpg`, { type: "image/jpeg" });
      editedFiles.push(file);
    }
    navigate("/upload", { state: { files: editedFiles, primaryIndex, removeBg, aiDetect } });

    // 非裁切模式：沿用原本 cover/contain 與旋轉規則，輸出成正方形
    // 已改為逐張裁切/輸出流程
  }

  return (
    <Layout title="編輯照片">
      <div className="page-wrapper pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-3xl mx-auto px-4 mt-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            {/* Preview area */}
            <div ref={cropWrapRef} className="w-full max-w-[480px] mx-auto aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative">
              {previewUrls[currentIndex] && (
                (cropModeArr[currentIndex] ?? true) ? (
                  // 裁切模式下，使用 Cropper 支援雙指縮放與拖移
                  <Cropper
                    image={previewUrls[currentIndex]}
                    crop={cropArr[currentIndex] || { x: 0, y: 0 }}
                    zoom={zoomArr[currentIndex] || 1}
                    aspect={1}
                    cropSize={viewportSide ? { width: viewportSide, height: viewportSide } : undefined}
                    // 不固定比例，避免被壓縮，使用者可自由縮放與拖移
                    // aspect 未設定代表自由比例
                    onCropChange={(v) => setCropArr((prev) => { const arr = prev.slice(); arr[currentIndex] = v; return arr; })}
                    onZoomChange={(v) => setZoomArr((prev) => { const arr = prev.slice(); arr[currentIndex] = v; return arr; })}
                    onCropComplete={(_, areaPixels) => setCroppedAreaPixelsArr((prev) => { const arr = prev.slice(); arr[currentIndex] = areaPixels; return arr; })}
                    rotation={rotateArr[currentIndex] || 0}
                    objectFit={(fitArr[currentIndex] || 'free') === 'cover' ? 'cover' : 'contain'}
                    minZoom={minZoomArr[currentIndex] || 0.2}
                    maxZoom={8}
                    restrictPosition={(fitArr[currentIndex] || 'free') === 'cover'}
                    showGrid={showGrid}
                    onMediaLoaded={({ width, height }) => {
                      setMediaSizeArr((prev) => { const arr = prev.slice(); arr[currentIndex] = { width, height }; return arr; });
                      const mode = fitArr[currentIndex] || 'free';
                      if (mode === 'cover') {
                        requestAnimationFrame(() => applyCoverZoom({ width, height }, currentIndex));
                      } else {
                        requestAnimationFrame(() => applyContainZoom({ width, height }, currentIndex));
                      }
                    }}
                  />
                ) : (
                  <img
                    ref={imgRef}
                    src={previewUrls[currentIndex]}
                    alt="preview"
                    style={{ transform: `rotate(${(rotateArr[currentIndex]||0)}deg)`, objectFit: 'cover' }}
                    className="w-full h-full"
                  />
                )
              )}
            </div>

            {/* Controls */}
            <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 gap-2">
              <button
                type="button"
                className={`border rounded-lg py-2 ${(fitArr[currentIndex]||'free') === 'cover' ? 'bg-gray-900 text-white border-gray-900' : ''}`}
                onClick={() => {
                  const mode = fitArr[currentIndex] || 'free';
                  const next = mode === 'cover' ? 'free' : 'cover';
                  setFitArr((prev)=>{ const arr=prev.slice(); arr[currentIndex]=next; return arr; });
                  const ms = mediaSizeArr[currentIndex] || { width: 0, height: 0 };
                  if (next === 'cover') {
                    applyCoverZoom(ms, currentIndex);
                  } else {
                    applyContainZoom(ms, currentIndex);
                  }
                }}
              >
                滿版
              </button>
              <button
                type="button"
                className={`border rounded-lg py-2`}
                onClick={() => setRotateArr((prev) => { const arr = prev.slice(); arr[currentIndex] = ((arr[currentIndex]||0) + 90) % 360; return arr; })}
              >
                旋轉 90°
              </button>
              <button
                type="button"
                className="border rounded-lg py-2 col-span-2"
                onClick={() => {
                  setRotateArr((prev) => { const arr = prev.slice(); arr[currentIndex] = 0; return arr; });
                  setCropModeArr((prev) => { const arr = prev.slice(); arr[currentIndex] = true; return arr; });
                  setCropArr((prev) => { const arr = prev.slice(); arr[currentIndex] = { x: 0, y: 0 }; return arr; });
                  const ms = mediaSizeArr[currentIndex] || { width: 0, height: 0 };
                  // 重置為自由模式的初始縮放
                  const wrap = cropWrapRef.current;
                  if (wrap && ms.width && ms.height) {
                    const cw = wrap.clientWidth, ch = wrap.clientHeight;
                    const containZoom = Math.min(cw / ms.width, ch / ms.height);
                    setZoomArr((prev) => { const arr = prev.slice(); arr[currentIndex] = containZoom; return arr; });
                    setMinZoomArr((prev) => { const arr = prev.slice(); arr[currentIndex] = containZoom; return arr; });
                    setFitArr((prev)=>{ const arr=prev.slice(); arr[currentIndex]='free'; return arr; });
                  } else {
                    setZoomArr((prev) => { const arr = prev.slice(); arr[currentIndex] = 1; return arr; });
                  }
                  setCroppedAreaPixelsArr((prev) => { const arr = prev.slice(); arr[currentIndex] = null; return arr; });
                }}
              >
                重置
              </button>
            </div>

            <div className="mt-4 flex items-center gap-4 relative">
              <div className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={removeBg}
                  onChange={(e) => setRemoveBg(e.target.checked)}
                />
                <span>智慧去背</span>
                <button
                  type="button"
                  aria-label="去背說明"
                  className="w-7 h-7 rounded-full border flex items-center justify-center text-gray-600 active:scale-95"
                  onClick={() => { setShowInfo((v) => !v); setShowAIDesc(false); }}
                >
                  <Icon path={mdiInformationSlabCircleOutline} size={0.9} color="currentColor" />
                </button>
              </div>
              <div className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={aiDetect}
                  onChange={(e) => setAiDetect(e.target.checked)}
                />
                <span>AI 辨識</span>
                <button
                  type="button"
                  aria-label="AI 辨識說明"
                  className="w-7 h-7 rounded-full border flex items-center justify-center text-gray-600 active:scale-95"
                  onClick={() => { setShowAIDesc((v) => !v); setShowInfo(false); }}
                >
                  <Icon path={mdiInformationSlabCircleOutline} size={0.9} color="currentColor" />
                </button>
              </div>

              {showInfo && (
                <div className="absolute left-0 top-full mt-2 max-w-xs text-sm bg-black text-white px-3 py-2 rounded-lg shadow-lg z-10 pointer-events-none">
                  使用去背功能需要較長的處理時間，請耐心等待。
                </div>
              )}
              {showAIDesc && (
                <div className="absolute left-0 top-full mt-2 max-w-xs text-sm bg-black text-white px-3 py-2 rounded-lg shadow-lg z-10 pointer-events-none">
                  使用AI辨識，幫你辨識衣物名稱、類別、顏色與風格。
                </div>
              )}
            </div>

            {/* Thumbnails and primary selector */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">共 {previewUrls.length} 張，當前第 {currentIndex+1} 張</div>
                <button
                  type="button"
                  className={`px-3 py-1 rounded border ${primaryIndex===currentIndex? 'bg-black text-white border-black':'border-gray-300'}`}
                  onClick={() => setPrimaryIndex(currentIndex)}
                >
                  設為主圖
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {previewUrls.map((u, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    className={`relative w-20 h-20 rounded overflow-hidden border ${i===currentIndex? 'border-blue-600':'border-gray-200'}`}
                  >
                    <img src={u} alt={`thumb-${i}`} className="object-cover w-full h-full" />
                    {i===primaryIndex && (
                      <span className="absolute top-1 left-1 bg-black text-white text-[10px] px-1 rounded">主圖</span>
                    )}
                  </button>
                ))}
              </div>
              {/* 去除上一張/下一張按鈕，改由點選縮圖切換 */}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 border rounded-lg py-3"
                onClick={() => navigate("/upload/select")}
              >
                上一步
              </button>
              <button
                className="flex-1 bg-black text-white rounded-lg py-3"
                onClick={handleNext}
              >
                下一步
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
