import React from "react";

export default function DesktopRightPanel() {
  return (
    <div className="bg-white rounded-2xl shadow-sm w-56 p-3 text-xs">
      <div className="text-xs text-gray-500">建議面板</div>

      <div className="mt-3 space-y-2">
        <div className="p-2 bg-gray-50 rounded">今日溫度：26°C</div>
        <div className="p-2 bg-gray-50 rounded">熱門單品：運動鞋</div>
        <div className="p-2 bg-gray-50 rounded">購買建議</div>
      </div>
    </div>
  );
}
