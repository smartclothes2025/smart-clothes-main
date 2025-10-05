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
    <div className="page-wrapper">
      
      <div className="app-max px-2 mt-2 space-y-4">
        <div/>
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
