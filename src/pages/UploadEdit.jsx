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
import { useToast } from "../components/ToastProvider"; // ✨ 1. 引入 useToast

export default function UploadEdit({ theme, setTheme }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { addToast } = useToast(); // ✨ 2. 初始化 addToast
  const srcFile = state?.file || null;
  const srcFiles = state?.files || (srcFile ? [srcFile] : []);
  
  const imgRef = useRef(null);
  const cropWrapRef = useRef(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [removeBg, setRemoveBg] = useState(true);
  const [aiDetect, setAiDetect] = useState(false);
  
  // ✨ 3. 移除 showInfo 和 showAIDesc 狀態
  // const [showInfo, setShowInfo] = useState(false);
  // const [showAIDesc, setShowAIDesc] = useState(false);

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
      // 使用寬高最小值確保 cropSize 不會超出可見區域
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

  async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
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
    return new Promise((res) => outCanvas.toBlob(res, "image/jpeg", 0.92));
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

      const blob = await getCroppedImg(pv, {
        x: Math.round(cropPixels.x),
        y: Math.round(cropPixels.y),
        width: Math.round(cropPixels.width),
        height: Math.round(cropPixels.height),
      }, rot);
      if (!blob) continue;
      const baseName = srcFiles[i].name?.replace(/\.[^.]+$/, "") || `image_${i + 1}`;
      const file = new File([blob], `${baseName}_edited.jpg`, { type: "image/jpeg" });
      editedFiles.push(file);
    }
    navigate("/upload", { state: { files: editedFiles, primaryIndex, removeBg, aiDetect } });
  }

  return (
    <Layout title="編輯照片">
      <div className="page-wrapper pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-5xl mx-auto px-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
              <div className="lg:col-span-3">
                <div
                  ref={cropWrapRef}
                  className="w-full max-w-none bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center relative"
                  style={{ aspectRatio: '1 / 1', maxHeight: 'min(100vw, 70vh)' }}
                >
                  {previewUrls[currentIndex] &&
                    ((cropModeArr[currentIndex] ?? true) ? (
                      <Cropper
                        image={previewUrls[currentIndex]}
                        crop={cropArr[currentIndex] || { x: 0, y: 0 }}
                        zoom={zoomArr[currentIndex] || 1}
                        aspect={1}
                        cropSize={viewportSide ? { width: viewportSide, height: viewportSide } : undefined}
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
                <div className="mt-2 text-sm text-gray-600">共 {previewUrls.length} 張，當前第 {currentIndex + 1} 張</div>
              </div>

              <div className="lg:col-span-2">
                <div className="rounded-xl p-4 backdrop-blur-md bg-white/30 border border-white/20 shadow-lg">
                  <div className="mb-4 grid grid-cols-3 gap-3">
                    <button title="切換滿版 / 自由" type="button" onClick={() => {
                      const next = (fitArr[currentIndex] || "free") === "cover" ? "free" : "cover";
                      setFitArr((prev) => { const arr = [...prev]; arr[currentIndex] = next; return arr; });
                      const ms = mediaSizeArr[currentIndex];
                      if (next === "cover") applyCoverZoom(ms, currentIndex); else applyContainZoom(ms, currentIndex);
                    }}
                    className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400 ${ (fitArr[currentIndex] || "free") === "cover" ? "bg-white/10" : "bg-white/5" }`}>
                      <Icon path={mdiCropFree} size={1} aria-hidden />
                      <span className="text-xs mt-1 whitespace-nowrap">滿版</span>
                    </button>

                    <button title="旋轉 90°" type="button" onClick={() => setRotateArr((prev) => { const arr = [...prev]; arr[currentIndex] = ((arr[currentIndex] || 0) + 90) % 360; return arr; })}
                    className="flex flex-col items-center justify-center gap-1 py-3 rounded-lg transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white/5">
                      <Icon path={mdiRotateRight} size={1} aria-hidden />
                      <span className="text-xs mt-1 whitespace-nowrap">旋轉</span>
                    </button>

                    <button title="重置" type="button" onClick={() => {
                      setRotateArr((prev) => { const arr = [...prev]; arr[currentIndex] = 0; return arr; });
                      setCropArr((prev) => { const arr = [...prev]; arr[currentIndex] = { x: 0, y: 0 }; return arr; });
                      setFitArr((prev) => { const arr = [...prev]; arr[currentIndex] = "free"; return arr; });
                      applyContainZoom(mediaSizeArr[currentIndex]);
                    }}
                    className="flex flex-col items-center justify-center gap-1 py-3 rounded-lg transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white/5">
                      <Icon path={mdiRefresh} size={1} aria-hidden />
                      <span className="text-xs mt-1 whitespace-nowrap">重置</span>
                    </button>
                  </div>

                  <div className="mb-4 p-3 rounded-lg bg-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 cursor-pointer whitespace-nowrap">
                          <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} className="form-checkbox" />
                          <span className="select-none">智慧去背</span>
                        </label>
                        <button type="button" aria-label="去背說明" title="去背說明"
                          onClick={() => addToast({ type: 'info', title: '智慧去背說明', message: '使用去背功能需要較長的處理時間，請耐心等待。' })}
                          className="p-2 rounded-full transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400">
                          <Icon path={mdiInformationSlabCircleOutline} size={0.9} />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 cursor-pointer whitespace-nowrap">
                          <input type="checkbox" checked={aiDetect} onChange={(e) => setAiDetect(e.target.checked)} className="form-checkbox" />
                          <span className="select-none">AI 辨識</span>
                        </label>
                        <button type="button" aria-label="AI 說明" title="AI 說明"
                          onClick={() => addToast({ type: 'info', title: 'AI 辨識說明', message: '使用 AI 辨識可幫你自動判斷衣物類別、顏色與風格，加速標註流程。' })}
                          className="p-2 rounded-full transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400">
                          <Icon path={mdiInformationSlabCircleOutline} size={0.9} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 p-3 rounded-lg bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-700 flex items-center gap-2">
                        <Icon path={mdiImageMultiple} size={0.9} />
                        <span className="whitespace-nowrap">共 {previewUrls.length} 張</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {previewUrls.map((u, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCurrentIndex(i)}
                          className={`relative w-20 h-20 rounded overflow-hidden border ${i === currentIndex ? "border-blue-600" : "border-white/20"} transition transform hover:scale-105`}
                          title={`第 ${i + 1} 張`}
                        >
                          <img src={u} alt={`thumb-${i}`} className="object-cover w-full h-full" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white/5 flex gap-3">
                    <button
                      className="flex-1 flex items-center justify-center gap-2 border rounded-lg py-3 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      onClick={() => navigate("/upload/select")}
                    >
                      <Icon path={mdiChevronLeft} size={1} />
                      <span className="whitespace-nowrap">上一步</span>
                    </button>
                    <button
                      className="flex-1 flex items-center justify-center gap-2 bg-black text-white rounded-lg py-3 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      onClick={handleNext}
                    >
                      <span className="whitespace-nowrap">下一步</span>
                      <Icon path={mdiChevronRight} size={1} />
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