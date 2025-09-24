// src/components/wardrobe/Analysis.jsx

import { useState } from 'react';

// 假設的身體數據 (只保留數值，單位在旁邊顯示)
const initialMetrics = {
  height: '165', weight: '55', bust: '85', shoulder: '40',
  waist: '68', hips: '92', shoeSize: '24.5'
};
// 單位物件，方便管理
const units = {
  height: 'cm', weight: 'kg', bust: 'cm', shoulder: 'cm',
  waist: 'cm', hips: 'cm', shoeSize: ''
};

// 身體數據元件 (已更新為可編輯)
const BodyMetrics = () => {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMetrics(prevMetrics => ({
      ...prevMetrics,
      [name]: value,
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
    // 在真實應用中，這裡會呼叫 API 將數據儲存到後端
    console.log("數據已儲存:", metrics);
  };
  
  const renderMetricItem = (key, label) => (
    <div className="flex items-center justify-between py-2 border-b">
      <span className="text-gray-700">{label}</span>
      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            name={key}
            value={metrics[key]}
            onChange={handleInputChange}
            className="w-24 text-right p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {units[key] && <span className="text-gray-500">{units[key]}</span>}
        </div>
      ) : (
        <span className="font-medium text-black">{metrics[key]} {units[key]}</span>
      )}
    </div>
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">身體數據</h3>
        {isEditing ? (
          <button onClick={handleSave} className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">
            儲存
          </button>
        ) : (
          <button onClick={() => setIsEditing(true)} className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300">
            編輯
          </button>
        )}
      </div>
      <div className="space-y-2">
        {renderMetricItem('height', '身高')}
        {renderMetricItem('weight', '體重')}
        {renderMetricItem('bust', '胸圍')}
        {renderMetricItem('shoulder', '肩寬')}
        {renderMetricItem('waist', '腰圍')}
        {renderMetricItem('hips', '臀圍')}
        {renderMetricItem('shoeSize', '鞋子尺寸')}
      </div>
    </div>
  );
};

// 我的衣櫥分析元件 (維持不變)
const WardrobeAnalysis = () => {
  const items = [
    { name: "牛仔褲", wearCount: 25 }, { name: "白色 T 恤", wearCount: 15 },
    { name: "風衣外套", wearCount: 8 }, { name: "黑色洋裝", wearCount: 3 },
    { name: "A字裙", wearCount: 1 },
  ];
  const frequentlyWorn = items.filter(item => item.wearCount > 10);
  const infrequentlyWorn = items.filter(item => item.wearCount <= 10);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">我的衣櫥</h3>
      <div className="space-y-4">
        <section>
          <h4 className="font-semibold text-green-700">常穿衣物</h4>
          <ul className="list-disc list-inside mt-2 text-gray-600">
            {frequentlyWorn.map(item => <li key={item.name}>{item.name} ({item.wearCount} 次)</li>)}
          </ul>
        </section>
        <section>
          <h4 className="font-semibold text-amber-700">不常穿衣物</h4>
          <ul className="list-disc list-inside mt-2 text-gray-600">
            {infrequentlyWorn.map(item => <li key={item.name}>{item.name} ({item.wearCount} 次)</li>)}
          </ul>
        </section>
      </div>
    </div>
  );
};


const analysisTabs = ["身體數據", "我的衣櫥"];

// 👇 確保這裡是 `export default`
export default function Analysis() {
  const [activeSubTab, setActiveSubTab] = useState(analysisTabs[0]);

  return (
    <div>
      <div className="flex gap-4 mb-4">
        {analysisTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`pb-1 font-medium ${activeSubTab === tab ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-400 hover:text-gray-600"}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div>
        {activeSubTab === "身體數據" && <BodyMetrics />}
        {activeSubTab === "我的衣櫥" && <WardrobeAnalysis />}
      </div>
    </div>
  );
}