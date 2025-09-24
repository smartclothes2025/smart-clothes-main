import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ThemeSelect from '../components/ThemeSelect';
import { Bell } from 'lucide-react';

const Row = ({children, onClick}) => (
  <div onClick={onClick} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:bg-gray-50 cursor-pointer">
    <div>{children}</div>
    <div className="text-gray-400">›</div>
  </div>
);

export default function Settings({theme,setTheme}){
  const nav = useNavigate();
  return (
    <div className="min-h-screen pb-32 lg:pl-72">
      <Header title="設定" theme={theme} setTheme={setTheme} />
      <div className="app-max px-4 mt-4 space-y-4">
        <Row onClick={() => { /* open notifications */ }}>
          <div className="flex items-center gap-3"><Bell className="w-5 h-5 text-gray-600" /> 通知</div>
        </Row>

        <Row onClick={() => {}}>
          收藏的穿搭
        </Row>

        <Row onClick={() => {}}>
          收藏的貼文
        </Row>

        <Row onClick={() => {}}>
          使用說明
        </Row>

        <Row onClick={() => {}}>
          帳號設定
        </Row>

        <Row onClick={() => {}}>
          關於
        </Row>

        <Row onClick={() => {}}>
          聯絡我們
        </Row>

        <Row onClick={() => {}}>
          切換主題
          <ThemeSelect theme={theme} setTheme={setTheme} />
        </Row>
      
      </div>
    </div>
  );
}
