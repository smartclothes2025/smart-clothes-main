import { useState } from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';

export default function Upload({ theme, setTheme }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    category: "上衣",
    color: "",
    material: "棉",
    style: "休閒",
    size: "M",
    brand: ""
  });
  const [autoTag, setAutoTag] = useState(true);

  function handleSubmit(e) {
    e.preventDefault();
    alert("已上傳：" + form.name);
    navigate(-1);
  }

  return (
    <div className="min-h-screen pb-32 pt-6 px-4 lg:pl-72">
      <Header title="新增衣物" theme={theme} setTheme={setTheme} />

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm text-gray-600">上傳照片</label>
          <div className="mt-2 h-48 bg-gray-50 rounded-md flex items-center justify-center">拖曳或點擊上傳</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <div>
            <label className="block text-sm text-gray-600">名稱</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full mt-1 p-3 border rounded-lg"
              placeholder="例：白色T恤"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="p-3 border rounded-lg w-full">
              <option>上衣</option>
              <option>褲裝</option>
              <option>裙子</option>
              <option>連衣裙</option>
            </select>

            <input
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              placeholder="顏色"
              className="p-3 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.material}
              onChange={(e) => setForm({ ...form, material: e.target.value })}
              placeholder="材質"
              className="p-3 border rounded-lg"
            />
            <input
              value={form.style}
              onChange={(e) => setForm({ ...form, style: e.target.value })}
              placeholder="風格"
              className="p-3 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
              placeholder="尺寸"
              className="p-3 border rounded-lg"
            />
            <input
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder="品牌"
              className="p-3 border rounded-lg"
            />
          </div>

          <div>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoTag}
                onChange={(e) => setAutoTag(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">AI 自動分類（模擬 90%）</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-lg">完成</button>
            <button type="button" onClick={() => navigate(-1)} className="flex-1 border py-3 rounded-lg">取消</button>
          </div>
        </div>
      </form>
    </div>
  );
}
