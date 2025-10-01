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

export default function Settings({theme, setTheme}){
  const nav = useNavigate();

  // --- 新增登出處理函式 ---
  const handleLogout = () => {
    // 1. 清除儲存在 localStorage 的登入憑證 (token)
    localStorage.removeItem('token');

    // 2. 使用 navigate 跳轉到 /login 頁面
    // { replace: true } 可以避免使用者按下 "上一頁" 又回到需要登入的頁面
    nav('/login', { replace: true });

    // 3. (可選) 重新整理頁面確保所有狀態被重設
    // window.location.reload(); 
  };

  return (
    <div className="min-h-screen pb-32 pt-6 px-4 lg:pl-72">
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
        
        {/* --- 將 handleLogout 綁定到 onClick 事件 --- */}
        <Row onClick={handleLogout}>
          登出
        </Row>
      </div>
    </div>
  );
}