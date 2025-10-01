export default function CategoryGrid(){
  const cats = [
    { key: "上衣", emoji: "👕" },
    { key: "褲裝", emoji: "👖" },
    { key: "裙子", emoji: "👗" },
    { key: "連衣裙", emoji: "🎀" },
  ];
  return (
    <div className="grid grid-cols-4 gap-3">
      {cats.map((c) => (
        <div key={c.key} className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm hover:scale-105 transform transition">
          <div className="text-2xl">{c.emoji}</div>
          <div className="text-sm font-medium">{c.key}</div>
        </div>
      ))}
    </div>
  );
}
