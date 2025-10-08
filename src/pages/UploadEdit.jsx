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

  const imgRef = useRef(null);
  const cropWrapRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rotate, setRotate] = useState(0); // degree
  const [fit, setFit] = useState("cover"); // 'contain' | 'cover'
  const [removeBg, setRemoveBg] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  // 裁切相關狀態（支援手機雙指縮放/拖移）
  const [cropMode, setCropMode] = useState(true);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [mediaSize, setMediaSize] = useState({ width: 0, height: 0 });

  // 將圖片縮放到剛好「滿版」覆蓋容器
  const applyCoverZoom = (ms = mediaSize) => {
    const wrap = cropWrapRef.current;
    if (!wrap || !ms.width || !ms.height) return;
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    const coverZoom = Math.max(cw / ms.width, ch / ms.height);
    setZoom(coverZoom);
    setCrop({ x: 0, y: 0 });
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

    canvas.width = bBoxW;ㄎ
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
    if (!srcFile) return;
    const url = URL.createObjectURL(srcFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [srcFile]);

  if (!srcFile) {
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
    const img = imgRef.current;

    if (cropMode && croppedAreaPixels) {
      const blob = await getCroppedImg(previewUrl, {
        x: Math.round(croppedAreaPixels.x),
        y: Math.round(croppedAreaPixels.y),
        width: Math.round(croppedAreaPixels.width),
        height: Math.round(croppedAreaPixels.height),
      }, rotate);
      const edited = new File(
        [blob],
        srcFile.name.replace(/\.[^.]+$/, "") + "_edited.jpg",
        { type: "image/jpeg" }
      );
      navigate("/upload", { state: { file: edited, removeBg } });
      return;
    }

    // 非裁切模式：沿用原本 cover/contain 與旋轉規則，輸出成正方形
    const size = 1024; // 輸出解析度
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = size;
    canvas.height = size;

    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotate * Math.PI) / 180);

    const { naturalWidth: iw, naturalHeight: ih } = img;
    const targetW = size;
    const targetH = size;
    const ir = iw / ih;
    const tr = targetW / targetH;

    let drawW, drawH;
    if (fit === "cover") {
      if (ir > tr) {
        drawH = targetH;
        drawW = drawH * ir;
      } else {
        drawW = targetW;
        drawH = drawW / ir;
      }
    } else {
      if (ir > tr) {
        drawW = targetW;
        drawH = drawW / ir;
      } else {
        drawH = targetH;
        drawW = drawH * ir;
      }
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.92));
    const edited = new File(
      [blob],
      srcFile.name.replace(/\.[^.]+$/, "") + "_edited.jpg",
      { type: "image/jpeg" }
    );
    navigate("/upload", { state: { file: edited, removeBg } });
  }

  return (
    <Layout title="編輯照片">
      <div className="page-wrapper pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-3xl mx-auto px-4 mt-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div ref={cropWrapRef} className="w-full h-[70vh] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative">
              {previewUrl && (
                cropMode ? (
                  // 裁切模式下，使用 Cropper 支援雙指縮放與拖移
                  <Cropper
                    image={previewUrl}
                    crop={crop}
                    zoom={zoom}
                    // 不固定比例，避免被壓縮，使用者可自由縮放與拖移
                    // aspect 未設定代表自由比例
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                    rotation={rotate}
                    objectFit={fit === "cover" ? "cover" : "contain"}
                    minZoom={1}
                    maxZoom={8}
                    restrictPosition={false}
                    showGrid={showGrid}
                    onMediaLoaded={({ width, height }) => {
                      setMediaSize({ width, height });
                      if (fit === "cover") {
                        // 初次載入時自動滿版
                        requestAnimationFrame(() => applyCoverZoom({ width, height }));
                      } else {
                        setZoom(1);
                      }
                    }}
                  />
                ) : (
                  <img
                    ref={imgRef}
                    src={previewUrl}
                    alt="preview"
                    style={{ transform: `rotate(${rotate}deg)`, objectFit: fit }}
                    className="w-full h-full"
                  />
                )
              )}
            </div>

            <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 gap-2">
              <button
                type="button"
                className={`border rounded-lg py-2 ${fit === "cover" ? "bg-gray-900 text-white border-gray-900" : ""}`}
                onClick={() => {
                  const next = fit === "cover" ? "contain" : "cover";
                  setFit(next);
                  if (next === "cover") {
                    applyCoverZoom();
                  } else {
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                  }
                }}
              >
                滿版
              </button>
              <button
                type="button"
                className={`border rounded-lg py-2`}
                onClick={() => setRotate((r) => (r + 90) % 360)}
              >
                旋轉 90°
              </button>
              <button
                type="button"
                className={`border rounded-lg py-2 ${showGrid ? "bg-gray-900 text-white border-gray-900" : ""}`}
                onClick={() => setShowGrid((v) => !v)}
              >
                格線
              </button>
              <button
                type="button"
                className="border rounded-lg py-2 col-span-1 sm:col-span-2"
                onClick={() => {
                  setRotate(0);
                  setFit("contain");
                  setCropMode(true);
                  setCrop({ x: 0, y: 0 });
                  setZoom(1);
                  setCroppedAreaPixels(null);
                }}
              >
                重置
              </button>
            </div>

            <div className="mt-4 flex items-center relative">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={removeBg}
                  onChange={(e) => setRemoveBg(e.target.checked)}
                />
                <span>智慧去背</span>
              </label>
              {/* 說明按鈕（手機點擊可顯示） */}
              <button
                type="button"
                aria-label="去背說明"
                className="ml-2 w-7 h-7 rounded-full border flex items-center justify-center text-gray-600 active:scale-95"
                onClick={() => setShowInfo((v) => !v)}
              >
                <Icon path={mdiInformationSlabCircleOutline} size={0.9} color="currentColor" />
              </button>

              {showInfo && (
                <div className="absolute left-0 top-full mt-2 max-w-xs text-sm bg-black text-white px-3 py-2 rounded-lg shadow-lg z-10">
                  會在下一步呼叫後端 API 進行去背。
                </div>
              )}

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
