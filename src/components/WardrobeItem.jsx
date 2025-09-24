export default function WardrobeItem({item}){
  return (
    <div className="bg-white rounded-2xl p-3 shadow-md hover:shadow-lg transition">
      <div className="h-44 bg-gradient-to-br from-gray-50 to-white rounded-lg flex items-center justify-center text-xl">👚</div>
      <div className="mt-3 flex items-center justify-between">
        <div>
          <div className="font-semibold">{item.name}</div>
          <div className="text-xs text-gray-500">{item.category} • {item.color}</div>
        </div>
        <div className="text-gray-400">⋯</div>
      </div>
    </div>
  );
}
