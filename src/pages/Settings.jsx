import { useNavigate } from 'react-router-dom';
import ThemeSelect from '../components/ThemeSelect';
import { Bell } from 'lucide-react';

const Row = ({ children, onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:bg-gray-50 cursor-pointer"
  >
    <div>{children}</div>
    <div className="text-gray-400">›</div>
  </div>
);

export default function Settings({ theme, setTheme, setIsLoggedIn }) {
  const nav = useNavigate();

  const handleLogout = () => {
    // 1) 清除登入憑證
    localStorage.removeItem('token');
    // 2) 更新 App 的登入狀態
    setIsLoggedIn(false);
    // 3) 導回登入頁（replace 避免回上一頁又回到內頁）
    nav('/', { replace: true });
  };

  return (
    <div className="min-h-full pb-32 pt-4 md:pb-0 px-4 lg:pl-72">
      {/* 本頁標題（Header 由 App.jsx 控制，避免重複與跑版） */}
      <div className="app-max px-2 mt-2 space-y-4">
        <h1 className="text-xl font-semibold mb-2">設定</h1>

        <Row onClick={() => { /* 之後可導到通知頁 */ }}>
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-600" /> 通知
          </div>
        </Row>

        <Row onClick={() => { /* 收藏的穿搭 */ }}>
          收藏的穿搭
        </Row>

        <Row onClick={() => { /* 收藏的貼文 */ }}>
          收藏的貼文
        </Row>

        <Row onClick={() => { /* 使用說明 */ }}>
          使用說明
        </Row>

        <Row onClick={() => { /* 帳號設定 */ }}>
          帳號設定
        </Row>

        <Row onClick={() => { /* 關於 */ }}>
          關於
        </Row>

        <Row onClick={() => { /* 聯絡我們 */ }}>
          聯絡我們
        </Row>

        <Row onClick={() => { /* 切換主題在這裡直接放 ThemeSelect */ }}>
          <div className="w-full flex items-center justify-between gap-3">
            <span>切換主題</span>
            <ThemeSelect theme={theme} setTheme={setTheme} />
          </div>
        </Row>

        <Row onClick={handleLogout}>
          <span className="text-red-600">登出</span>
        </Row>

        <br />
      </div>
    </div>
  );
}
