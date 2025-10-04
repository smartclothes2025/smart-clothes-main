import Header from '../components/Header';
import WeatherCard from '../components/WeatherCard';
import RecommendInactive from '../components/RecommendInactive';
import DesktopRightPanel from '../components/DesktopRightPanel';
import Search from '../components/Search';


export default function Home({ theme, setTheme }) {
  return (
  <div className="min-h-full pb-32 md:pb-0 px-4 lg:pl-72">

      <div className="lg:pr-[380px]">

        <Header title="智慧穿搭" theme={theme} setTheme={setTheme} />

        <div className="app-max px-4">
          <main className="space-y-8 pt-4"> 

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

      <div className="fixed top-16 right-8 hidden lg:block w-80">
        <DesktopRightPanel />
      </div>

    </div>
  );
}