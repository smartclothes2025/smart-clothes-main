import Header from '../components/Header';
import WeatherCard from '../components/WeatherCard';
import RecommendInactive from '../components/RecommendInactive';
import DesktopRightPanel from '../components/DesktopRightPanel';
import Search from '../components/Search';

// 這是你的 Home 頁面完整元件
export default function Home({ theme, setTheme }) {
  return (
    // 1. 最外層的頁面容器，設定了左側邊欄的空間 (lg:pl-72) 和頁面整體的 padding (pt-6, px-4)
    <div className="min-h-screen pb-32 pt-6 px-4 lg:pl-72">

      {/* 2. 主要內容欄，這個 div 負責為右側面板預留空間 (lg:pr-[380px]) */}
      <div className="lg:pr-[380px]">

        {/* Header 現在在這個容器內，所以它的寬度也會被限制，不會被右側面板覆蓋 */}
        <Header title="智慧穿搭" theme={theme} setTheme={setTheme} />

        {/* 主要內容區域 */}
        <div className="app-max px-4">
          <main className="space-y-8 pt-4"> {/* 增加了垂直間距和一點頂部間距 */}

            <Search />

            <WeatherCard />

            <section className="mt-6 max-h-[60vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-3">推薦</h2>
              <RecommendInactive days={90} showTitle={false} />
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">穿搭動態</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 shadow-sm flex flex-col">
                  <div className="h-40 bg-gray-50 rounded-md flex items-center justify-center">🧥</div>
                  <div className="mt-3 font-medium">輕薄外套</div>
                  <div className="text-sm text-gray-500">NT$ 1200</div>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm flex flex-col">
                  <div className="h-40 bg-gray-50 rounded-md flex items-center justify-center">👟</div>
                  <div className="mt-3 font-medium">運動鞋</div>
                  <div className="text-sm text-gray-500">NT$ 2200</div>
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>

      {/* 3. 右側固定面板，獨立於主要內容欄之外 */}
      <div className="fixed top-12 right-8 hidden lg:block w-80">
        <DesktopRightPanel />
      </div>

    </div>
  );
}