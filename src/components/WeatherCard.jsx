export default function WeatherCard(){
  const today = new Date();
  const dateStr = today.toLocaleDateString();
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-white rounded-2xl p-4 shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-indigo-600">{dateStr}</div>
          <div className="mt-1 text-3xl font-bold text-gray-900">26°C</div>
          <div className="text-sm text-gray-500">晴 · 適合輕便休閒</div>
        </div>
        <div className="text-6xl">☀️</div>
      </div>
      <div className="mt-3 flex gap-2">
        <button className="px-3 py-1 bg-white/90 rounded-full text-sm shadow-sm">外出</button>
        <button className="px-3 py-1 bg-white/90 rounded-full text-sm shadow-sm">上班</button>
        <button className="px-3 py-1 bg-white/90 rounded-full text-sm shadow-sm">約會</button>
      </div>
    </div>
  );
}
