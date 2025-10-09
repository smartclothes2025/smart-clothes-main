import WeatherCard from "../components/WeatherCard";
import RecommendInactive from "../components/RecommendInactive";
import DesktopRightPanel from "../components/DesktopRightPanel";
import Search from "../components/Search";
import Layout from "../components/Layout";

export default function Home({ theme, setTheme }) {
  return (
    <Layout title="智慧穿搭">
      <div className="page-wrapper">
        <div className="max-w-10xl mt-2">
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
                  <div className="h-40 bg-gray-50 rounded-md flex items-center justify-center">
                    🧥
                  </div>
                  <div className="mt-3 font-medium">輕薄外套</div>
                  <div className="text-sm text-gray-500">NT$ 1200</div>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm flex flex-col">
                  <div className="h-40 bg-gray-50 rounded-md flex items-center justify-center">
                    👟
                  </div>
                  <div className="mt-3 font-medium">運動鞋</div>
                  <div className="text-sm text-gray-500">NT$ 2200</div>
                </div>
              </div>
            </section>
          </main>
        </div>
        {/* <div className="fixed top-16 right-3 hidden lg:block w-65">
          <DesktopRightPanel />
        </div> */}
      </div>
    </Layout>
  );
}
