import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout'; // 假設您的 Layout 在 components/
import {
    BellIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    BellSlashIcon,
    SparklesIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { useNotifications } from '../contexts/NotificationContext';

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

// 輔助函式：計算時間距離現在的相對時間
function getRelativeTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins} 分鐘前`;
    if (diffHours < 24) return `${diffHours} 小時前`;
    if (diffDays < 30) return `${diffDays} 天前`;
    return time.toLocaleDateString('zh-TW');
}

export default function Notice() {
    const { notifications, markAsRead, markAllAsRead, clearNotification, unreadCount, loading } = useNotifications();
    const [filter, setFilter] = useState('all'); // 'all' 或 'unread'

    // 過濾通知
    const filteredNotifications = useMemo(() => {
        if (filter === 'unread') {
            return notifications.filter(n => n.unread);
        }
        return notifications;
    }, [notifications, filter]);

    // 點擊單一通知 (標記為已讀)
    const handleItemClick = (id) => {
        markAsRead(id);
    };

    // 刪除單一通知
    const handleDeleteNotification = (e, id) => {
        e.stopPropagation();
        clearNotification(id);
    };

    const hasUnread = unreadCount > 0;

    return (
        <Layout title="通知中心">
            <div className="page-wrapper">
                <div className="flex justify-between items-center mb-4 mt-6 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filter === 'all'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-slate-700 hover:bg-slate-100'
                                }`}
                        >
                            全部通知
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filter === 'unread'
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
                                className={`relative p-4 bg-white rounded-xl shadow-sm flex items-start gap-4 cursor-pointer transition-colors hover:bg-slate-50 ${item.unread ? 'bg-indigo-50 border border-indigo-100 hover:bg-indigo-100' : 'bg-white'
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
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            {typeof item.details === 'string' ? item.details : JSON.stringify(item.details)}
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-400 mt-1">{getRelativeTime(item.timestamp)}</p>
                                </div>

                                {/* 刪除按鈕 */}
                                <button
                                    onClick={(e) => handleDeleteNotification(e, item.id)}
                                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    title="刪除通知"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
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