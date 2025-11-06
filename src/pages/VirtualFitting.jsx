// src/pages/VirtualFitting.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://127.0.0.1:8000";

export default function VirtualFitting({ theme, setTheme }) {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState([]);
  const [bodyMetrics, setBodyMetrics] = useState(null);
  const [showBodyMetricsInput, setShowBodyMetricsInput] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 表單數據
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [syncToPost, setSyncToPost] = useState(false);
  
  // 身體數據表單
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [chestCm, setChestCm] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [hipCm, setHipCm] = useState("");
  const [shoulderCm, setShoulderCm] = useState("");
  
  // 衣物位置映射（簡化版，實際可以更複雜）
  const [clothingPositions, setClothingPositions] = useState({
    hat: null,
    top: null,
    bottom: null,
    shoes: null,
    accessory: null,
  });
  

  const [generatedImageUrl, setGeneratedImageUrl] = useState(null); // 👈 新增狀態來儲存生成的圖片 URL
  const [generating, setGenerating] = useState(false); // 👈 新增狀態來顯示載入中
  
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
    
    // 載入用戶身體數據
    fetchBodyMetrics();
  }, [navigate]);

  const fetchBodyMetrics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/v1/me/body_metrics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data && Object.keys(data).length > 0) {
          setBodyMetrics(data);
          setHeightCm(data.height_cm || '');
          setWeightKg(data.weight_kg || '');
          setChestCm(data.chest_cm || '');
          setWaistCm(data.waist_cm || '');
          setHipCm(data.hip_cm || '');
          setShoulderCm(data.shoulder_cm || '');
        } else {
          setShowBodyMetricsInput(true);
        }
      } else {
        setShowBodyMetricsInput(true);
      }
    } catch (err) {
      console.error('載入身體數據失敗:', err);
      setShowBodyMetricsInput(true);
    } finally {
      setLoading(false);
    }
  };

  const saveBodyMetrics = async () => {
    // 驗證數據
    if (!heightCm && !weightKg && !chestCm && !waistCm && !hipCm && !shoulderCm) {
      alert('請至少填寫一項身體數據');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token);
      console.log('API Base:', API_BASE);
      
      const payload = {
        height_cm: heightCm ? parseFloat(heightCm) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        chest_cm: chestCm ? parseFloat(chestCm) : null,
        waist_cm: waistCm ? parseFloat(waistCm) : null,
        hip_cm: hipCm ? parseFloat(hipCm) : null,
        shoulder_cm: shoulderCm ? parseFloat(shoulderCm) : null,
      };
      
      console.log('Saving body metrics:', payload);
      
      const res = await fetch(`${API_BASE}/api/v1/me/body_metrics`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      
      console.log('Response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Saved data:', data);
        setBodyMetrics(data);
        setShowBodyMetricsInput(false);
        alert('✅ 身體數據已保存！');
      } else {
        const errorText = await res.text();
        console.error('Save failed:', errorText);
        alert(`❌ 保存失敗: ${res.status} - ${errorText}`);
      }
    } catch (err) {
      console.error('保存身體數據失敗:', err);
      alert(`❌ 保存失敗: ${err.message}`);
    }
  };



// 👇 新增：發送 AI 圖片生成請求
const handleGenerateImage = async () => {
    if (selectedItems.length === 0) {
        alert('請先選擇衣物！');
        return;
    }

    setGenerating(true);
    setGeneratedImageUrl(null);

    try {
        const token = localStorage.getItem('token');
        const payload = {
            user_input: title.trim() || "根據選中的衣物生成一套適合日常穿著的時尚穿搭。", // 使用標題或預設文字作為 AI Prompt
            selected_items: selectedItems.map(item => ({ // 傳遞給後端精確的清單
                id: item.id,
                name: item.name,
                category: item.category
            }))
        };

        const res = await fetch(`${API_BASE}/api/v1/fitting/generate`, { // 呼叫新的 API 端點
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
                alert('✅ AI 逼真穿搭圖已生成！');
            } else {
                alert(`⚠️ 圖檔生成失敗，這是文字建議: ${result.text || '無文字建議'}`);
            }
        } else {
            const errorText = await res.text();
            alert(`❌ API 呼叫失敗: ${res.status} - ${errorText}`);
        }
    } catch (err) {
        console.error('生成圖片失敗:', err);
        alert('❌ 系統錯誤：無法連接 AI 服務');
    } finally {
        setGenerating(false);
    }
};
// 👆 新增：發送 AI 圖片生成請求


  const handleSaveOutfit = async () => {
    if (!title.trim()) {
      alert('請填寫標題');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // 如果選擇同步到貼文
      if (syncToPost) {
        const postRes = await fetch(`${API_BASE}/api/v1/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            content: description.trim(),
            tags: tags.split(/[,\s]+/).filter(t => t).join(','),
            clothing_ids: selectedItems.map(item => item.id),
            image_url: generatedImageUrl,
          }),
        });
        
        if (postRes.ok) {
          alert('穿搭已保存並發布到貼文！');
        } else {
          alert('穿搭已保存，但發布到貼文時出現問題');
        }
      } else {
        alert('穿搭已保存！');
      }
      
      // 清理並返回
      localStorage.removeItem('virtual_fitting_items');
      navigate('/wardrobe');
    } catch (err) {
      console.error('保存穿搭失敗:', err);
      alert('保存失敗，請檢查網路連線');
    }
  };

  return (
    <Layout title="虛擬試衣" theme={theme} setTheme={setTheme}>
      <div className="page-wrapper">
        <div className="max-w-6xl mx-auto p-4">
          {loading ? (
            <div className="text-center py-8">載入中...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左側：人體模型區域 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">虛擬試衣模型</h2>
                { <font color="red">👇 新增：AI 圖片生成按鈕</font>  }**
                <button
                  onClick={handleGenerateImage}
                  disabled={generating || selectedItems.length === 0}
                  className="mb-4 w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {generating ? '🤖 AI 正在生成圖片...' : '📸 點擊生成 AI 逼真穿搭圖'}
                </button>
                { <font color="red">👆 新增：AI 圖片生成按鈕</font>  }**

                {/* 身體數據顯示/輸入 */}
                {showBodyMetricsInput ? (
                  <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold mb-2">請輸入您的身體數據</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="身高 (cm)"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="體重 (kg)"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="胸圍 (cm)"
                        value={chestCm}
                        onChange={(e) => setChestCm(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="腰圍 (cm)"
                        value={waistCm}
                        onChange={(e) => setWaistCm(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="臀圍 (cm)"
                        value={hipCm}
                        onChange={(e) => setHipCm(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="肩寬 (cm)"
                        value={shoulderCm}
                        onChange={(e) => setShoulderCm(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      onClick={saveBodyMetrics}
                      className="mt-3 w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
                    >
                      保存身體數據
                    </button>
                  </div>
                ) : bodyMetrics && (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">身體數據</h3>
                      <button
                        onClick={() => setShowBodyMetricsInput(true)}
                        className="text-sm text-indigo-600 hover:underline"
                      >
                        編輯
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      {bodyMetrics.height_cm && <div>身高: {bodyMetrics.height_cm} cm</div>}
                      {bodyMetrics.weight_kg && <div>體重: {bodyMetrics.weight_kg} kg</div>}
                      {bodyMetrics.chest_cm && <div>胸圍: {bodyMetrics.chest_cm} cm</div>}
                      {bodyMetrics.waist_cm && <div>腰圍: {bodyMetrics.waist_cm} cm</div>}
                      {bodyMetrics.hip_cm && <div>臀圍: {bodyMetrics.hip_cm} cm</div>}
                      {bodyMetrics.shoulder_cm && <div>肩寬: {bodyMetrics.shoulder_cm} cm</div>}
                    </div>
                  </div>
                )}
                
                {/* 人體模型展示區 */}
                <div className="relative bg-gradient-to-b from-blue-50 to-gray-50 rounded-lg p-8 min-h-[600px] flex items-center justify-center overflow-hidden">
                  { <font color="red">👇 修改：優先顯示 AI 生成圖，其次是載入中，最後是 SVG 模型</font> }
                  {generating ? (
                  <div className="relative" style={{ width: '280px', height: '550px' }}>
                    {/* 動態調整的人體模型 SVG */}
                    {(() => {
                      // 根據身體數據計算比例
                      const baseHeight = 170; // 基準身高 (cm)
                      const currentHeight = parseFloat(heightCm) || baseHeight;
                      const heightScale = currentHeight / baseHeight;
                      
                      const baseChest = 90; // 基準胸圍 (cm)
                      const currentChest = parseFloat(chestCm) || baseChest;
                      const chestScale = currentChest / baseChest;
                      
                      const baseWaist = 70; // 基準腰圍 (cm)
                      const currentWaist = parseFloat(waistCm) || baseWaist;
                      const waistScale = currentWaist / baseWaist;
                      
                      const baseShoulder = 40; // 基準肩寬 (cm)
                      const currentShoulder = parseFloat(shoulderCm) || baseShoulder;
                      const shoulderScale = currentShoulder / baseShoulder;
                      
                      // 計算身體各部位尺寸
                      const headRadius = 22;
                      const bodyWidth = 45 * chestScale;
                      const bodyHeight = 75 * heightScale;
                      const waistWidth = 35 * waistScale;
                      const shoulderWidth = 55 * shoulderScale;
                      const legHeight = 130 * heightScale;
                      
                      return (
                        <svg viewBox="0 0 200 400" className="w-full h-auto">
                          {/* 頭部 */}
                          <circle cx="100" cy="30" r={headRadius} fill="#f9fafb" stroke="#6b7280" strokeWidth="2" />
                          
                          {/* 肩臂 */}
                          <line 
                            x1={100 - shoulderWidth/2} y1="60" 
                            x2="45" y2="110" 
                            stroke="#9ca3af" strokeWidth="7" strokeLinecap="round" 
                          />
                          <line 
                            x1={100 + shoulderWidth/2} y1="60" 
                            x2="155" y2="110" 
                            stroke="#9ca3af" strokeWidth="7" strokeLinecap="round" 
                          />
                          
                          {/* 上身（胸部） */}
                          <rect 
                            x={100 - bodyWidth/2} y="55" 
                            width={bodyWidth} height={bodyHeight * 0.5} 
                            rx="8" fill="#f9fafb" stroke="#6b7280" strokeWidth="2" 
                          />
                          
                          {/* 下身（腰臀） */}
                          <rect 
                            x={100 - waistWidth/2} y={55 + bodyHeight * 0.5} 
                            width={waistWidth} height={bodyHeight * 0.5} 
                            rx="8" fill="#f9fafb" stroke="#6b7280" strokeWidth="2" 
                          />
                          
                          {/* 腿部 */}
                          <line 
                            x1="90" y1={55 + bodyHeight} 
                            x2="85" y2={55 + bodyHeight + legHeight} 
                            stroke="#9ca3af" strokeWidth="9" strokeLinecap="round" 
                          />
                          <line 
                            x1="110" y1={55 + bodyHeight} 
                            x2="115" y2={55 + bodyHeight + legHeight} 
                            stroke="#9ca3af" strokeWidth="9" strokeLinecap="round" 
                          />
                          
                          {/* 衣物圖片疊加 */}
                          {clothingPositions.hat && (
                            <>
                              <image 
                                href={clothingPositions.hat.img} 
                                x="70" y="5" width="60" height="60" 
                                preserveAspectRatio="xMidYMid meet"
                                opacity="0.95"
                              />
                            </>
                          )}
                          {clothingPositions.top && (
                            <>
                              <image 
                                href={clothingPositions.top.img} 
                                x={100 - bodyWidth/2 - 5} y="60" 
                                width={bodyWidth + 10} height={bodyHeight * 0.8} 
                                preserveAspectRatio="xMidYMid meet"
                                opacity="0.9"
                              />
                            </>
                          )}
                          {clothingPositions.bottom && (
                            <>
                              <image 
                                href={clothingPositions.bottom.img} 
                                x={100 - waistWidth/2 - 3} y={55 + bodyHeight * 0.6} 
                                width={waistWidth + 6} height={legHeight * 0.7} 
                                preserveAspectRatio="xMidYMid meet"
                                opacity="0.9"
                              />
                            </>
                          )}
                          {clothingPositions.shoes && (
                            <>
                              <image 
                                href={clothingPositions.shoes.img} 
                                x="60" y={55 + bodyHeight + legHeight - 30} 
                                width="80" height="40" 
                                preserveAspectRatio="xMidYMid meet"
                                opacity="0.95"
                              />
                            </>
                          )}
                        </svg>
                      );
                    })()}
                    
                    {/* 衣物名稱標籤 */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                      {clothingPositions.hat && (
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                          🧢 {clothingPositions.hat.name}
                        </div>
                      )}
                      {clothingPositions.top && (
                        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                          👕 {clothingPositions.top.name}
                        </div>
                      )}
                      {clothingPositions.bottom && (
                        <div className="absolute top-2/3 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                          👖 {clothingPositions.bottom.name}
                        </div>
                      )}
                      {clothingPositions.shoes && (
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                          👟 {clothingPositions.shoes.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                ) }
                { <font color="red">👆 修改：人體模型展示區邏輯結束</font> }
                <div className="mt-4">
                  {/* 已選擇的衣物列表 */}
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
              </div>
              
              {/* 右側：表單區域 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
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
                
                {/* 操作按鈕 */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveOutfit}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    保存穿搭
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem('virtual_fitting_items');
                      navigate('/wardrobe');
                    }}
                    className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}