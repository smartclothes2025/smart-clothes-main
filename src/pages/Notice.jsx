import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout'; // 假設您的 Layout 在 components/
import { 
  BellIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  BellSlashIcon, 
  SparklesIcon 
} from '@heroicons/react/24/outline';

// --- 模擬的通知資料 ---
const mockNotifications = [
  {
    id: 1,
    type: 'new_item', // 新增衣物
    message: '「藍色牛仔褲」已成功新增',
    details: '現在您可以在「我的衣櫃」中查看它。',
    timestamp: '5 分鐘前',
    unread: true,
  },
  {
    id: 2,
    type: 'suggestion', // 穿搭建議
    message: '您有新的穿搭建議',
    details: '根據今天的天氣，我們為您產生了 3 套新穿搭。',
    timestamp: '15 分鐘前',
    unread: true,
  },
  {
    id: 3,
    type: 'system', // 系統通知
    message: '歡迎使用智慧穿衣！',
    details: '別忘了到「設定」頁面完善您的個人資料。',
    timestamp: '1 小時前',
    unread: false,
  },
  {
    id: 4,
    type: 'alert', 
    message: '天氣預報：即將降溫',
    details: '建議您明天多加一件外套。',
    timestamp: '3 小時前',
    unread: false,
  },
];

function NotificationIcon({ type }) {
  let icon, bgColor, iconColor;

  switch (type) {
    case 'new_item':
      icon = <CheckCircleIcon className="w-5 h-5" />;
      bgColor = 'bg-green-100';
      iconColor = 'text-green-600';
      break;
    case 'suggestion':
      icon = <SparklesIcon className="w-5 h-5" />;
      bgColor = 'bg-yellow-100';
      iconColor = 'text-yellow-600';
      break;
    case 'alert':
      icon = <ExclamationTriangleIcon className="w-5 h-5" />;
      bgColor = 'bg-red-100';
      iconColor = 'text-red-600';
      break;
    case 'system':
    default:
      icon = <BellIcon className="w-5 h-5" />;
      bgColor = 'bg-indigo-100';
      iconColor = 'text-indigo-600';
      break;
  }

  return (
    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${bgColor} ${iconColor}`}>
      {icon}
    </div>
  );
}

export default function Notice() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState('all'); // 'all' 或 'unread'

  // 過濾通知
  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter(n => n.unread);
    }
    return notifications;
  }, [notifications, filter]);

  // 全部標記為已讀
  const markAllAsRead = () => {
    setNotifications(
      notifications.map(n => ({ ...n, unread: false }))
    );
  };

  // 點擊單一通知 (標記為已讀)
  const handleItemClick = (id) => {
    setNotifications(
      notifications.map(n => 
        n.id === id ? { ...n, unread: false } : n
      )
    );
  };

  const hasUnread = notifications.some(n => n.unread);

  return (
    <Layout title="通知中心">
      <div className="page-wrapper">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                filter === 'all' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              全部通知
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                filter === 'unread' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              未讀
            </button>
          </div>
          
          <button
            onClick={markAllAsRead}
            disabled={!hasUnread}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            全部已讀
          </button>
        </div>

        {/* --- 通知列表 --- */}
        <div className="flex-grow space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(item => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`relative p-4 bg-white rounded-xl shadow-sm flex items-start gap-4 cursor-pointer transition-colors hover:bg-slate-50 ${
                  item.unread ? 'bg-indigo-50 border border-indigo-100 hover:bg-indigo-100' : 'bg-white'
                }`}
              >
                {/* 未讀標記 (小點) */}
                {item.unread && (
                  <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>
                )}
                
                {/* 圖示 */}
                <NotificationIcon type={item.type} />
                
                {/* 內容 */}
                <div className="flex-grow">
                  <p className="text-sm font-semibold text-slate-800">{item.message}</p>
                  {item.details && (
                    <p className="text-sm text-slate-500 mt-0.5">{item.details}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">{item.timestamp}</p>
                </div>
              </div>
            ))
          ) : (
            // --- 空狀態 ---
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <BellSlashIcon className="w-16 h-16 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-600 mt-4">沒有新通知</h3>
              <p className="text-slate-400 mt-1">您所有的通知都會顯示在這裡。</p>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}