import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

const API_BASE = import.meta.env?.VITE_API_BASE || "https://cometical-kyphotic-deborah.ngrok-free.dev";

export default function VirtualFitting({ theme, setTheme }) {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // (🔴 1. 新增 state 來控制頁面步驟 🔴)
  const [step, setStep] = useState(1);

  // 表單數據
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [syncToPost, setSyncToPost] = useState(false);

  // 用戶照片上傳
  const [userPhoto, setUserPhoto] = useState(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState(null);

  // 衣物位置映射（簡化版，實際可以更複雜）
  const [clothingPositions, setClothingPositions] = useState({
    hat: null,
    top: null,
    bottom: null,
    shoes: null,
    accessory: null,
  });


  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  useEffect(() => {
    // 從 localStorage 載入選中的單品
    const items = JSON.parse(localStorage.getItem('virtual_fitting_items') || '[]');
    if (items.length === 0) {
      alert('請先選擇衣物單品');
      navigate('');
      return;
    }
    setSelectedItems(items);

    // 自動分配衣物到對應位置
    const positions = { hat: null, top: null, bottom: null, shoes: null, accessory: null };
    items.forEach(item => {
      const category = item.category;
      if (category === '帽子') positions.hat = item;
      else if (category === '上衣' || category === '外套' || category === '洋裝') positions.top = item;
      else if (category === '褲子' || category === '裙子') positions.bottom = item;
      else if (category === '鞋子') positions.shoes = item;
      else positions.accessory = item;
    });
    setClothingPositions(positions);

    setLoading(false);
    autoGenerateImage(items);
  }, [navigate]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUserPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserPhotoPreview(reader.result);
        // 上傳照片後自動重新生成
        autoGenerateImage(selectedItems, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 自動生成 AI 穿搭圖（頁面載入時調用）
  const autoGenerateImage = async (items, photoBase64 = null) => {
    if (!items || items.length === 0) {
      return;
    }
    setGenerating(true);
    setGeneratedImageUrl(null);
    setGenerationError(null);
    try {
      const token = localStorage.getItem('token');

      const payload = {
        user_input: photoBase64
          ? "根據我的照片和選中的衣物，生成一套適合我的時尚穿搭"
          : "專業時尚模特兒展示，高質感穿搭攝影，自然光線，簡約背景",
        selected_items: items.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category
        }))
      };

      if (photoBase64) {
        payload.user_photo = photoBase64;
      }

      const res = await fetch(`${API_BASE}/fitting/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.type === 'image' && result.url) {
          setGeneratedImageUrl(result.url);
        } else {
          setGenerationError(result.text || '請配置 AI 圖片生成服務');
        }
      } else {
        const errorText = await res.text();
        setGenerationError(`生成失敗: ${errorText}`);
      }
    } catch (err) {
      console.error('生成圖片失敗:', err);
      setGenerationError(`錯誤: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  // 手動重新生成
  const handleRegenerate = () => {
    autoGenerateImage(selectedItems, userPhotoPreview);
  };

  // src/pages/VirtualFitting.jsx

  // (🔴 替換掉整個 handleSaveOutfit 函數 🔴)
  const handleSaveOutfit = async () => {
    if (!title.trim()) {
      alert('請填寫標題');
      return;
    }

    try { // (1. 這是我們的 try 區塊)
      const token = localStorage.getItem('token');
      if (!token) {
        alert('請先登入');
        navigate('/login');
        return;
      }

      const item_ids = selectedItems.map(item => Number(item.id));
      const today = new Date().toISOString().split('T')[0];

      // --- 第一階段：POST /outfits ---
      const outfitStage1Res = await fetch(`${API_BASE}/outfits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          worn_date: today,
          image_url: generatedImageUrl,
          is_ai_generated: true,
          item_ids: item_ids,
        }),
      });

      // (🔴 2. 這是最關鍵的錯誤處理)
      if (!outfitStage1Res.ok) {
        const resClone = outfitStage1Res.clone();
        // 嘗試從後端獲取詳細的 JSON 錯誤訊息 (例如 422 錯誤)
        try {
          const errorBody = await outfitStage1Res.json();
          // 'detail' 是 FastAPI 驗證錯誤的預設欄位
          const errorDetail = errorBody.detail || JSON.stringify(errorBody);
          console.error('後端驗證失敗 (Stage 1):', errorDetail);
          // (🔴 3. 拋出一個*包含後端訊息*的錯誤)
          throw new Error(`保存圖片失敗 (1/2): ${errorDetail}`);
        } catch (e) {
          // 如果回傳的不是 JSON (例如 500 錯誤頁面)
          const errorText = await outfitStage1Res.text();
          console.error('伺服器錯誤 (Stage 1):', errorText);
          throw new Error(`伺服器錯誤 (1/2): ${outfitStage1Res.status} ${errorText}`);
        }
      }

      const newOutfit = await outfitStage1Res.json();
      const newOutfitId = newOutfit.id;

      // --- 第二階段：PATCH /outfits/{id} ---
      const outfitStage2Res = await fetch(`${API_BASE}/outfits/${newOutfitId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: title.trim(),
          description: description.trim(),
          tags: tags.split(/[,\s]+/).filter(t => t).join(','),
          is_public: syncToPost,
          is_complete: true,
        }),
      });

      if (!outfitStage2Res.ok) {
        const resClone2 = outfitStage2Res.clone();
        // (🔴 同樣的錯誤處理邏輯)
        try {
          const errorBody = await outfitStage2Res.json();
          const errorDetail = errorBody.detail || JSON.stringify(errorBody);
          console.error('後端驗證失敗 (Stage 2):', errorDetail);
          throw new Error(`保存詳情失敗 (2/2): ${errorDetail}`);
        } catch (e) {
          const errorText = await outfitStage2Res.text();
          console.error('伺服器錯誤 (Stage 2):', errorText);
          throw new Error(`伺服器錯誤 (2/2): ${outfitStage2Res.status} ${errorText}`);
        }
      }

      // ... (同步到貼文的邏輯) ...
      // 這裡也應該要有錯誤處理，但我們先簡化
      if (syncToPost) {
        const postRes = await fetch(`${API_BASE}/posts`, {
           // ... (您的貼文 fetch 內容) ...
        });
        if (postRes.ok) {
           alert('穿搭已保存並發布到貼文！');
        } else {
           alert('穿搭已保存，但發布到貼文時出現問題');
        }
      } else {
        alert('穿搭已保存！');
      }

      // 清理並導航
      localStorage.removeItem('virtual_fitting_items');
      navigate('/wardrobe?tab=穿搭');

    } catch (err) { // (🔴 4. 這是我們的 catch 區塊)
      console.error('保存穿搭失敗:', err);
      
      // (🔴 5. 顯示從 try 區塊拋出的*具體*錯誤訊息)
      // 而不是 "請檢查網路連線"
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        alert('保存失敗：無法連接到伺服器。\n請檢查您的 ngrok 服務是否正在運行，或是否有 CORS 錯誤。');
      } else {
        alert(err.message); // 🔴 這裡會顯示詳細的錯誤，例如 "保存圖片失敗 (1/2): ......"
      }
    }
  };

  return (
    <Layout title="虛擬試衣" theme={theme} setTheme={setTheme}>
      <div className="page-wrapper">
        <div className="w-full w-full mt-4 md:px-0:max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-8">載入中...</div>
          ) : (
            // (🔴 2. 移除 grid 佈局，改為使用 <> 和 step 判斷 🔴)
            <div className="lg:max-w-3xl lg:mx-auto"> {/* (🔴 3. 新增 wrapper 讓單一頁面置中並限制寬度 🔴) */}
              
              {/* (🔴 4. 顯示頁面一：圖片生成 🔴) */}
              {step === 1 && (
                <div className="bg-white rounded-xl shadow-xl p-4 md:p-6">
                  {/* 用戶照片上傳 */}
                  <div className="mb-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">📸 上傳您的照片</h3>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="block w-full text-center bg-white border-2 border-dashed border-pink-300 rounded-lg px-4 py-3 cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-colors"
                    >
                      {userPhotoPreview ? (
                        <div className="flex items-center justify-center gap-3">
                          <img src={userPhotoPreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                          <span className="text-sm text-gray-600">點擊更換照片</span>
                        </div>
                      ) : (
                        <div>
                          <div className="text-2xl mb-1">📷</div>
                          <div className="text-sm text-gray-600">點擊上傳您的照片</div>
                          <div className="text-xs text-gray-400 mt-1">AI 會根據您的外貌生成更真實的試穿效果</div>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="relative bg-gradient-to-b from-blue-50 to-gray-50 rounded-lg p-4 sm:p-8 min-h-[400px] h-[60vh] max-h-[700px] flex items-center justify-center overflow-hidden">

                    {generating ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">AI 正在生成逼真穿搭圖...</p>
                        <p className="text-xs text-gray-500 mt-2">這可能需要 10-30 秒</p>
                      </div>
                    ) : generationError ? (
                      <div className="text-center max-w-md">
                        <div className="text-4xl mb-4">⚠️</div>
                        <p className="text-gray-700 font-medium mb-2">AI 生成服務未配置</p>
                        <div className="text-xs text-left bg-white p-4 rounded-lg border border-gray-200 whitespace-pre-wrap">
                          {generationError}
                        </div>
                        <button
                          onClick={handleRegenerate}
                          className="mt-4 text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                        >
                          重試
                        </button>
                      </div>
                    ) : generatedImageUrl ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <img
                          src={generatedImageUrl}
                          alt="AI 生成的穿搭圖"
                          className="w-full h-full object-contain rounded-lg shadow-lg"
                        />
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📸</div>
                        <p className="text-gray-600 font-medium">請上傳您的照片</p>
                        <p className="text-sm text-gray-500 mt-2">AI 將根據您的照片生成專業試穿效果</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">已選擇的衣物</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedItems.map(item => (
                        <div key={item.id} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                          <img src={item.img} alt={item.name} className="w-8 h-8 object-cover rounded" />
                          <span className="text-sm">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* (🔴 5. 在圖片生成後，於頁面一最下方新增「下一頁」按鈕 🔴) */}
                  {generatedImageUrl && !generating && (
                    <button
                      onClick={() => setStep(2)}
                      className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors font-medium mt-6"
                    >
                      下一步
                    </button>
                  )}
                  {/* (🔴 變更結束 🔴) */}
                </div>
              )}

              {/* (🔴 6. 顯示頁面二：表單填寫 🔴) */}
              {step === 2 && (
                <div className="bg-white rounded-xl shadow-xl p-4 md:p-6">
                  <h2 className="text-xl font-bold mb-4">穿搭資訊</h2>

                  {/* 標題 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">標題 (必填)</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="為您的穿搭下個標題吧"
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  {/* 描述 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">想要分享什麼？</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="分享您的穿搭心得、單品故事..."
                      rows={6}
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  {/* 標籤 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2"># 標籤</label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="例如：OOTD 帽子 藍色穿搭"
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">用空格或逗號分隔不同標籤</p>
                  </div>

                  {/* 同步到貼文選項 */}
                  <div className="mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syncToPost}
                        onChange={(e) => setSyncToPost(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium">同步發到貼文中</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      勾選後，這個穿搭會自動發布到您的貼文動態
                    </p>
                  </div>

                  {/* (🔴 7. 修改操作按鈕：新增「返回」按鈕，並調整佈局 🔴) */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="order-2 sm:order-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      返回
                    </button>
                    <button
                      onClick={handleSaveOutfit}
                      className="order-1 sm:order-2 flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      保存穿搭
                    </button>
                    <button
                      onClick={() => {
                        localStorage.removeItem('virtual_fitting_items');
                        navigate('/wardrobe');
                      }}
                      className="order-3 w-full sm:w-auto bg-red-100 text-red-700 py-3 px-6 rounded-lg hover:bg-red-200 transition-colors font-medium"
                    >
                      取消
                    </button>
                  </div>
                  {/* (🔴 變更結束 🔴) */}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}