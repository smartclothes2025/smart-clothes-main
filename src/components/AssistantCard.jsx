import { Link } from 'react-router-dom';

export default function AssistantCard(){
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="text-lg font-semibold">穿搭小助手</h3>
      <p className="text-gray-600 mt-2">嗨！我是你的穿搭小助手 — 建議：黑色褲子 + 白色上衣 + 簡約運動鞋。</p>
      <div className="mt-3 flex gap-3">
        <Link to="/recommend" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg text-center">推薦穿搭</Link>
        <Link to="/wardrobe" className="flex-1 border border-gray-200 py-2 rounded-lg text-center">整理衣櫃</Link>
      </div>
    </div>
  );
}
