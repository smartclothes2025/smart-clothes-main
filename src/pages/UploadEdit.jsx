import React, { useEffect, useRef, useState } from "react";
import Icon from "@mdi/react";
import {
  mdiInformationSlabCircleOutline,
  mdiCropFree,
  mdiRotateRight,
  mdiRefresh,
  mdiStar,
  mdiChevronLeft,
  mdiChevronRight,
  mdiImageMultiple,
} from "@mdi/js";
import Cropper from "react-easy-crop";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Header from "../components/Header";
import { useToast } from "../components/ToastProvider";

export default function UploadEdit({ theme, setTheme }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { addToast } = useToast();
  const srcFile = state?.file || null;
  const srcFiles = state?.files || (srcFile ? [srcFile] : []);

  const imgRef = useRef(null);
  const cropWrapRef = useRef(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [removeBg, setRemoveBg] = useState(false); // <- 預設改為 false
  const [aiDetect, setAiDetect] = useState(false);

  const [rotateArr, setRotateArr] = useState([]);
  const [fitArr, setFitArr] = useState([]);
  const [cropModeArr, setCropModeArr] = useState([]);
  const [cropArr, setCropArr] = useState([]);
  const [zoomArr, setZoomArr] = useState([]);
  const [croppedAreaPixelsArr, setCroppedAreaPixelsArr] = useState([]);
  const showGrid = true;
  const [mediaSizeArr, setMediaSizeArr] = useState([]);
  const [minZoomArr, setMinZoomArr] = useState([]);
  const [viewportSide, setViewportSide] = useState(0);

  useEffect(() => {
    const wrap = cropWrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => {
      const side = Math.min(wrap.clientWidth || 0, wrap.clientHeight || 0);
      setViewportSide(side);
    });
    ro.observe(wrap);
    const side = Math.min(wrap.clientWidth || 0, wrap.clientHeight || 0);
    setViewportSide(side);
    return () => ro.disconnect();
  }, []);

  const computeCoverZoom = (viewportW, viewportH, ms) => {
    if (!ms || !ms.width || !ms.height) return 1;
    return Math.max(viewportW / ms.width, viewportH / ms.height);
  };
  const computeContainZoom = (viewportW, viewportH, ms) => {
    if (!ms || !ms.width || !ms.height) return 1;
    return Math.min(viewportW / ms.width, viewportH / ms.height);
  };

  const applyCoverZoom = (ms, index = currentIndex) => {
    const wrap = cropWrapRef.current;
    if (!wrap) return;
    const { clientWidth: cw, clientHeight: ch } = wrap;
    const coverZoom = computeCoverZoom(cw, ch, ms);
    setZoomArr(p => { const a = [...p]; a[index] = coverZoom; return a; });
    setCropArr(p => { const a = [...p]; a[index] = { x: 0, y: 0 }; return a; });
    setMinZoomArr(p => { const a = [...p]; a[index] = coverZoom; return a; });
  };

  const applyContainZoom = (ms, index = currentIndex) => {
    const wrap = cropWrapRef.current;
    if (!wrap) return;
    const { clientWidth: cw, clientHeight: ch } = wrap;
    const containZoom = computeContainZoom(cw, ch, ms);
    setZoomArr(p => { const a = [...p]; a[index] = containZoom; return a; });
    setCropArr(p => { const a = [...p]; a[index] = { x: 0, y: 0 }; return a; });
    setMinZoomArr(p => { const a = [...p]; a[index] = containZoom; return a; });
  };

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
      width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };

  async function getCroppedImg(imageSrc, pixelCrop, rotation = 0, outputAsPng = false) {
    if (!pixelCrop || !pixelCrop.width || !pixelCrop.height) {
      console.error("Invalid pixelCrop provided to getCroppedImg");
      return null;
    }
    const image = await createImage(imageSrc);
    const rotRad = getRadianAngle(rotation);
    const { width: bBoxW, height: bBoxH } = rotateSize(image.width, image.height, rotation);
    const canvas = document.createElement("canvas");
    canvas.width = bBoxW;
    canvas.height = bBoxH;
    const ctx = canvas.getContext("2d");
    ctx.translate(bBoxW / 2, bBoxH / 2);
    ctx.rotate(rotRad);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);
    const outCanvas = document.createElement("canvas");
    outCanvas.width = pixelCrop.width;
    outCanvas.height = pixelCrop.height;
    outCanvas.getContext("2d").putImageData(data, 0, 0);
    return new Promise((res) => outCanvas.toBlob(res, outputAsPng ? "image/png" : "image/jpeg", 0.92));
  }

  useEffect(() => {
    if (!srcFiles.length) return;
    const urls = srcFiles.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
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

  async function handleNext() {
    const editedFiles = [];
    for (let i = 0; i < srcFiles.length; i++) {
      const pv = previewUrls[i];
      const rot = rotateArr[i] || 0;
      const cap = croppedAreaPixelsArr[i];
      let cropPixels = cap;
      if (!cropPixels) {
        try {
          const img = await createImage(pv);
          cropPixels = { x: 0, y: 0, width: img.width, height: img.height };
        } catch (err) {
          console.error(`無法載入第 ${i + 1} 張圖片`, err);
          addToast({ type: 'error', title: '圖片載入失敗', message: `第 ${i + 1} 張圖片載入失敗，請重試。` });
          return;
        }
      }

      const blob = await getCroppedImg(
        pv,
        {
          x: Math.round(cropPixels.x),
          y: Math.round(cropPixels.y),
          width: Math.round(cropPixels.width),
          height: Math.round(cropPixels.height),
        },
        rot,
        removeBg // 當 removeBg 為 true 時，前端輸出 PNG
      );
      if (!blob) continue;
    const originalName = srcFiles[i].name || '';
    const baseName = originalName.replace(/\.[^.]+$/, "") || `image_${i + 1}`;
    const extMatch = originalName.match(/(\.[^.]+$)/);
    const ext = extMatch ? extMatch[1] : '.jpg';
    // 不再加上 _edited，保留原始檔名（僅改副檔名為 jpg 如必要）
    const file = new File([blob], `${baseName}${ext}`, { type: "image/jpeg" });
      editedFiles.push(file);
    }
    navigate("/upload", { state: { files: editedFiles, primaryIndex, removeBg, aiDetect } });
  }

  return (
    <Layout title="編輯照片">
      <div className="page-wrapper pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className="lg:col-span-1">
              <div
                ref={cropWrapRef}
                className="w-full max-w-none bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative"
                style={{ aspectRatio: '1 / 1', maxHeight: 'min(100vw, 70vh)' }}
              >
                {previewUrls[currentIndex] &&
                  ((cropModeArr[currentIndex] ?? true) ? (
                    <Cropper
                      image={previewUrls[currentIndex]}
                      crop={cropArr[currentIndex] || { x: 0, y: 0 }}
                      zoom={zoomArr[currentIndex] || 1}
                      aspect={1}
                      cropSize={undefined}
                      onCropChange={(v) => setCropArr((prev) => { const arr = [...prev]; arr[currentIndex] = v; return arr; })}
                      onZoomChange={(v) => setZoomArr((prev) => { const arr = [...prev]; arr[currentIndex] = v; return arr; })}
                      onCropComplete={(_, areaPixels) => setCroppedAreaPixelsArr((prev) => { const arr = [...prev]; arr[currentIndex] = areaPixels; return arr; })}
                      rotation={rotateArr[currentIndex] || 0}
                      objectFit={(fitArr[currentIndex] || "free") === "cover" ? "cover" : "contain"}
                      minZoom={minZoomArr[currentIndex] || 0.2}
                      maxZoom={8}
                      restrictPosition={(fitArr[currentIndex] || "free") === "cover"}
                      showGrid={showGrid}
                      onMediaLoaded={({ width, height }) => {
                        setMediaSizeArr((prev) => { const arr = [...prev]; arr[currentIndex] = { width, height }; return arr; });
                        const mode = fitArr[currentIndex] || "free";
                        requestAnimationFrame(() => mode === "cover" ? applyCoverZoom({ width, height }, currentIndex) : applyContainZoom({ width, height }, currentIndex));
                      }}
                    />
                    ) : (
                    <img
                      ref={imgRef}
                      src={previewUrls[currentIndex]}
                      alt="preview"
                      style={{ transform: `rotate(${(rotateArr[currentIndex] || 0)}deg)`, objectFit: "cover" }}
                      className="w-full h-full"
                    />
                  ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="rounded-xl p-3 backdrop-blur-md bg-white/30 border border-white/20 shadow-lg lg:sticky lg:top-4">
                <div className="mb-3 grid grid-cols-3 gap-2">
                  <button title="切換滿版 / 自由" type="button" onClick={() => {
                    const next = (fitArr[currentIndex] || "free") === "cover" ? "free" : "cover";
                    setFitArr((prev) => { const arr = [...prev]; arr[currentIndex] = next; return arr; });
                    const ms = mediaSizeArr[currentIndex];
                    if (next === "cover") applyCoverZoom(ms, currentIndex); else applyContainZoom(ms, currentIndex);
                  }}
                  className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400 ${ (fitArr[currentIndex] || "free") === "cover" ? "bg-white/10" : "bg-white/5" }`}>
                    <Icon path={mdiCropFree} size={0.9} aria-hidden />
                    <span className="text-xs whitespace-nowrap">滿版</span>
                  </button>

                  <button title="旋轉 90°" type="button" onClick={() => setRotateArr((prev) => { const arr = [...prev]; arr[currentIndex] = ((arr[currentIndex] || 0) + 90) % 360; return arr; })}
                  className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white/5">
                    <Icon path={mdiRotateRight} size={0.9} aria-hidden />
                    <span className="text-xs whitespace-nowrap">旋轉</span>
                  </button>

                  <button title="重置" type="button" onClick={() => {
                    setRotateArr((prev) => { const arr = [...prev]; arr[currentIndex] = 0; return arr; });
                    setCropArr((prev) => { const arr = [...prev]; arr[currentIndex] = { x: 0, y: 0 }; return arr; });
                    setFitArr((prev) => { const arr = [...prev]; arr[currentIndex] = "free"; return arr; });
                    applyContainZoom(mediaSizeArr[currentIndex], currentIndex);
                  }}
                  className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white/5">
                    <Icon path={mdiRefresh} size={0.9} aria-hidden />
                    <span className="text-xs whitespace-nowrap">重置</span>
                  </button>
                </div>

                <div className="mb-3 p-2 rounded-lg bg-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                        <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} className="form-checkbox" />
                        <span className="select-none text-sm">智慧去背</span>
                      </label>
                      <button type="button" aria-label="去背說明" title="去背說明"
                        onClick={() => addToast({ type: 'info', title: '智慧去背說明', message: '使用去背功能需要較長的處理時間，請耐心等待。' })}
                        className="p-1.5 rounded-full transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400">
                        <Icon path={mdiInformationSlabCircleOutline} size={0.8} />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                        <input type="checkbox" checked={aiDetect} onChange={(e) => setAiDetect(e.target.checked)} className="form-checkbox" />
                        <span className="select-none text-sm">AI 辨識</span>
                      </label>
                      <button type="button" aria-label="AI 說明" title="AI 說明"
                        onClick={() => addToast({ type: 'info', title: 'AI 辨識說明', message: '使用 AI 辨識可幫你自動判斷衣物類別、顏色與風格，加速標註流程。' })}
                        className="p-1.5 rounded-full transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400">
                        <Icon path={mdiInformationSlabCircleOutline} size={0.8} />
                      </button>
                    </div>
                  </div>
                </div>

                {previewUrls.length > 1 && (
                  <div className="mb-3 p-2 rounded-lg bg-white/5">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : previewUrls.length - 1))}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
                        title="上一張"
                      >
                        <Icon path={mdiChevronLeft} size={0.8} />
                      </button>

                      <div className="flex-1 flex items-center justify-center gap-2">
                        <Icon path={mdiImageMultiple} size={0.8} className="text-gray-600" />
                        <span className="text-sm text-gray-700 whitespace-nowrap">
                          {currentIndex + 1} / {previewUrls.length}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCurrentIndex((prev) => (prev < previewUrls.length - 1 ? prev + 1 : 0))}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
                        title="下一張"
                      >
                        <Icon path={mdiChevronRight} size={0.8} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-2 rounded-lg bg-white/5 flex gap-2">
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 border rounded-lg py-2.5 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    onClick={() => navigate("/upload/select")}
                  >
                    <Icon path={mdiChevronLeft} size={0.9} />
                    <span className="whitespace-nowrap text-sm">上一步</span>
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 bg-black text-white rounded-lg py-2.5 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    onClick={handleNext}
                  >
                    <span className="whitespace-nowrap text-sm">下一步</span>
                    <Icon path={mdiChevronRight} size={0.9} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}