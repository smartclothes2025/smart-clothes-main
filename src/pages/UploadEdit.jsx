// src/pages/UploadEdit.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function UploadEdit({ theme, setTheme }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const srcFile = state?.file || null;

  const imgRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rotate, setRotate] = useState(0); // degree
  const [fit, setFit] = useState('contain'); // 'contain' | 'cover'
  const [removeBg, setRemoveBg] = useState(true);

  useEffect(() => {
    if (!srcFile) return;
    const url = URL.createObjectURL(srcFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [srcFile]);

  if (!srcFile) {
    return (
      <div className="min-h-full pb-24 pt-2 md:pb-0 px-2">
        <Header title="編輯照片" theme={theme} setTheme={setTheme} />
        <div className="lg:pl-72">
          <div className="max-w-xl mx-auto p-6 text-center text-gray-500">
            找不到圖片來源，請重新選擇。
            <div className="mt-4">
              <button className="px-4 py-2 rounded-lg border" onClick={() => navigate('/upload/select')}>返回選擇</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function handleNext() {
    // 將旋轉與 fit 套用到 canvas 產生新圖片
    const img = imgRef.current;
    if (!img) return;

    // 建立 canvas，依照 cover/contain 以正方形輸出，比較符合服飾縮圖
    const size = 1024; // 輸出解析度
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size; canvas.height = size;

    ctx.save();
    // 填白底，避免透明背景在 JPEG 變黑
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // 設定中心旋轉
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotate * Math.PI) / 180);

    // 依 fit 計算繪製尺寸
    const { naturalWidth: iw, naturalHeight: ih } = img;
    const targetW = size; const targetH = size;
    const ir = iw / ih;
    const tr = targetW / targetH;

    let drawW, drawH;
    if (fit === 'cover') {
      // 放大到覆蓋正方形
      if (ir > tr) {
        drawH = targetH; drawW = drawH * ir;
      } else {
        drawW = targetW; drawH = drawW / ir;
      }
    } else {
      // 等比縮小到完整顯示
      if (ir > tr) {
        drawW = targetW; drawH = drawW / ir;
      } else {
        drawH = targetH; drawW = drawH * ir;
      }
    }

    // 把圖片畫到中心
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
    const edited = new File([blob], srcFile.name.replace(/\.[^.]+$/, '') + '_edited.jpg', { type: 'image/jpeg' });

    navigate('/upload', { state: { file: edited, removeBg } });
  }

  return (
    <div className="min-h-full pb-24 pt-2 md:pb-0 px-2">
      <Header title="編輯照片" theme={theme} setTheme={setTheme} />
      <div className="lg:pl-72">
        <div className="max-w-3xl mx-auto px-4 mt-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="aspect-square w-full bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              {previewUrl && (
                <img
                  ref={imgRef}
                  src={previewUrl}
                  alt="preview"
                  style={{ transform: `rotate(${rotate}deg)`, objectFit: fit }}
                  className="max-h-full max-w-full"
                />
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
              <button
                type="button"
                className={`border rounded-lg py-2 ${fit === 'cover' ? 'bg-gray-900 text-white border-gray-900' : ''}`}
                onClick={() => setFit('cover')}
              >
                填滿
              </button>
              <button
                type="button"
                className={`border rounded-lg py-2 ${fit === 'contain' ? 'bg-gray-900 text-white border-gray-900' : ''}`}
                onClick={() => setFit('contain')}
              >
                裁切
              </button>
              <button
                type="button"
                className="border rounded-lg py-2"
                onClick={() => setRotate((r) => (r + 90) % 360)}
              >
                旋轉 90°
              </button>
              <button
                type="button"
                className="border rounded-lg py-2 col-span-1 sm:col-span-2"
                onClick={() => { setRotate(0); setFit('contain'); }}
              >
                重置
              </button>
            </div>

            <div className="mt-4 flex items-center">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} />
                <span>智慧去背</span>
              </label>
              <span className="ml-2 text-gray-400" title="會在下一步呼叫後端 API 建議使用清晰的正面照片，背景簡潔。若啟用去背，系統會自動辨識顏色與類別！">ⓘ</span>
            </div>

            <div className="mt-6 flex gap-3">
              <button className="flex-1 border rounded-lg py-3" onClick={() => navigate(-1)}>上一步</button>
              <button className="flex-1 bg-black text-white rounded-lg py-3" onClick={handleNext}>下一步</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
