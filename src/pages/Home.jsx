import WeatherCard from "../components/WeatherCard";
import RecommendInactive from "../components/RecommendInactive";
import Search from "../components/Search";
import Layout from "../components/Layout";
import HomePost from "../components/HomePost";

export default function Home({ theme, setTheme }) {
  return (
    <Layout title="智慧穿搭">
      <div className="page-wrapper">
        <div className="max-w-10xl mt-2">
          <main className="space-y-8 pt-4">
            <Search />
            <WeatherCard />
            <section className="mt-6 max-h-[60vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-3">今日推薦</h2>
              <RecommendInactive days={30} showTitle={false} />
            </section>
            <section>
              <h2 className="text-lg font-semibold mb-3">公開貼文</h2>
              <HomePost />
            </section>
          </main>
        </div>
      </div>
    </Layout>
  );
}
