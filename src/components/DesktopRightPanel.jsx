export default function DesktopRightPanel(){
  return (
    <div className="right-panel bg-white rounded-2xl shadow-sm">
      <div className="text-sm text-gray-500">建議面板</div>
      <div className="mt-4 space-y-3">
        <div className="p-3 bg-gray-50 rounded">今日溫度：26°C</div>
        <div className="p-3 bg-gray-50 rounded">熱門單品：運動鞋</div>
        <div className="p-3 bg-gray-50 rounded">購買建議</div>
      </div>
    </div>
  );
}
