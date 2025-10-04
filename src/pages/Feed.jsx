import Header from '../components/Header';

const Tab = ({label, active}) => (
  <div className={`px-4 py-2 rounded-full ${active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
    {label}
  </div>
);

const PostCard = ({emoji, title, content}) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-white rounded-full flex items-center justify-center text-2xl">{emoji}</div>
      <div className="flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-gray-500">2 小時前 · 追蹤者</div>
      </div>
    </div>
    <div className="text-gray-700 mt-2">{content}</div>
    <div className="flex gap-3 mt-2">
      <button className="px-3 py-1 bg-gray-100 rounded">讚</button>
      <button className="px-3 py-1 bg-gray-100 rounded">留言</button>
      <button className="px-3 py-1 bg-gray-100 rounded">分享</button>
    </div>
  </div>
);

export default function Feed({theme,setTheme}){
  return (
  <div className="min-h-full pb-32 md:pb-0 pt-6 px-4 lg:pl-72">
      <Header title="貼文" theme={theme} setTheme={setTheme} />
      <div className="app-max mt-4 space-y-4">
        <div className="flex gap-3">
          <Tab label="貼文" active />
          <Tab label="動態" />
          <Tab label="追蹤中" />
        </div>

        <div className="space-y-4 mt-4">
          <PostCard emoji="😊" title="今天心情不錯～" content="剛入手一雙好看的運動鞋，配上基本款白T超好看！" />
          <PostCard emoji="😕" title="搭配求助" content="想穿去朋友聚會，但不確定外套適不適合，大家幫忙看看～" />
          <PostCard emoji="😆" title="早安穿搭" content="今天穿了牛仔褲＋針織上衣，覺得舒服又好看！" />
        </div>
      </div>
    </div>
  );
}
