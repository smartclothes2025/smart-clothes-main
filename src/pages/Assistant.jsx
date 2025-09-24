import Header from '../components/Header';

export default function Assistant({theme,setTheme}){
  return (
    <div className="min-h-screen pb-32 pt-6 px-4 lg:pl-72">
      <Header title="穿搭小助手" theme={theme} setTheme={setTheme} />

      <div className="mt-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">今日建議</h3>
              <p className="text-sm text-gray-600 mt-1">黑色褲子 + 白色上衣，簡約鞋款。</p>
            </div>
            <div className="text-4xl">👗</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="bg-indigo-600 text-white py-3 rounded-lg">推薦穿搭</button>
          <button className="border py-3 rounded-lg">我要購買建議</button>
        </div>
      </div>
    </div>
  );
}
