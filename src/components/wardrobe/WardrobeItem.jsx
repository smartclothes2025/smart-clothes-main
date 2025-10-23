export default function WardrobeItem({
  item,
  selecting = false,
  active = false,
  onToggle = () => {},
  inactiveThreshold = 90,
  onDelete = () => {}, // ✅ 新增刪除 callback
  ownerId = null,
}) {
  const name = item?.name ?? "未命名";
  const category = item?.category ?? "";
  const color = item?.color ?? "";
  const img = item?.img ?? "";
  const daysInactive = typeof item?.daysInactive === 'number' ? item.daysInactive : null;

  return (
    <div
      className={`relative border rounded-xl p-3 bg-white shadow-sm transition-transform hover:scale-[1.01] ${
        selecting && active ? 'ring-2 ring-indigo-500' : ''
      }`}
      onClick={() => selecting && onToggle()}
    >
      {/* ✅ 刪除按鈕（非選取模式時顯示） */}
      {!selecting && (
        <button
        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
        className="absolute top-2 left-2 w-5 h-5 flex items-center justify-center text-gray-800 bg-white border border-gray-300 rounded-full hover:bg-gray-100 hover:text-black shadow-sm text-xs"
        title="刪除此衣物"
      >
        ✕
      </button>

      )}

      {/* 已 xx 天未穿 徽章 */}
      {daysInactive !== null && daysInactive >= inactiveThreshold && (
        <div className="absolute top-2 right-2 z-10">
          <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full shadow">
            已 {daysInactive} 天未穿
          </span>
        </div>
      )}

      {/* 選取圓點 */}
      {selecting && (
        <div
          className={`absolute top-2 left-2 w-5 h-5 rounded-full border flex items-center justify-center text-xs select-none
            ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-transparent'}`}
          aria-hidden
        >
          ✓
        </div>
      )}

      <div className="aspect-square w-full overflow-hidden rounded-lg flex items-center justify-center bg-gray-50">
        {img ? (
          <img src={img} alt={name} className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="text-2xl">👚</div>
        )}
      </div>

      <div className="mt-2 text-sm">
        <div className="font-medium truncate">{name}</div>
        <div className="text-gray-500 truncate">
          {category}
          {category && color ? ' • ' : ''}
          {color}
        </div>
        {ownerId != null && (
          <div className="text-xs text-gray-400 truncate mt-1">擁有者: {ownerId}</div>
        )}
      </div>
    </div>
  );
}
