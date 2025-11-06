import React, { useState } from 'react';

// 假設的品牌數據列表 (已擴充類別)
const brandData = [
    { name: 'Uniqlo', website: 'https://www.uniqlo.com/tw/zh/', category: '服飾', logoUrl: 'https://placehold.co/120x40/333333/ffffff?text=UNIQLO' },
    { name: 'Zara', website: 'https://www.zara.com/tw/zh/', category: '服飾', logoUrl: 'https://placehold.co/120x40/000000/ffffff?text=ZARA' },
    { name: 'H&M', website: 'https://www2.hm.com/zh_tw/index.html', category: '服飾', logoUrl: 'https://placehold.co/120x40/AA0000/ffffff?text=H%26M' },
    { name: 'NET', website: 'https://www.net-fashion.net/', category: '服飾', logoUrl: 'https://placehold.co/120x40/1f4d9d/ffffff?text=NET' },
];

const categories = Array.from(new Set(brandData.map(b => b.category)));

/**
 * 自訂訊息視窗元件，取代不允許的 alert()/confirm()
 * @param {object} props 
 * @returns {JSX.Element | null}
 */
const CustomMessageBox = ({ message, onClose }) => {
    if (!message) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full transform transition-all duration-300 scale-100">
                <p className="text-lg font-semibold text-gray-800 mb-4">
                    {message}
                </p>
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow hover:bg-indigo-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        確定
                    </button>
                </div>
            </div>
        </div>
    );
};


// 主要元件必須命名為 App 並匯出
export default function App() {
    const [query, setQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('所有品牌');
    const [message, setMessage] = useState(''); // 用於 CustomMessageBox

    const allCategories = ['所有品牌', ...categories];

    const filtered = brandData.filter((b) => {
        const matchesQuery = b.name.toLowerCase().includes(query.trim().toLowerCase());
        const matchesCategory = activeCategory === '所有品牌' || b.category === activeCategory;
        return matchesQuery && matchesCategory;
    });

    // 處理品牌點擊事件
    const handleBrandClick = (websiteUrl, brandName) => {
        try {
            // 使用 window.open 在新視窗中打開 URL
            const newWindow = window.open(websiteUrl, '_blank', 'noopener,noreferrer');
            
            // 檢查彈窗是否被阻擋
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                setMessage(`無法開啟 ${brandName} 官網。您的瀏覽器可能阻擋了彈出視窗。`);
            } else {
                newWindow.focus();
            }
        } catch (error) {
            console.error('開啟品牌官網失敗', error);
            setMessage('開啟品牌官網時發生錯誤。');
        }
    };

    // Logo 載入失敗時的佔位符
    const getPlaceholderLogo = (name) => `https://placehold.co/120x40/e0e0e0/555555?text=${name}`;


    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen font-inter">
            {/* 外部主卡片 (模擬應用程式風格) */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-6xl mx-auto">
                
                {/* 標題與搜尋區塊 */}
                <div className="mb-6 border-b pb-4">
                    <h1 className="text-2xl font-bold text-gray-800">品牌探索中心</h1>
                    <p className="text-gray-500 mt-1">在這裡管理與瀏覽您合作或感興趣的時尚品牌。</p>
                </div>

                {/* 類別與搜尋控制項 */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    {/* 搜尋欄位 */}
                    <input
                        type="text"
                        placeholder="搜尋品牌名稱..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full sm:w-1/3 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 shadow-sm"
                    />

                    {/* 類別篩選按鈕 */}
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        {allCategories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 text-sm font-medium rounded-full transition duration-150 
                                    ${activeCategory === cat 
                                        ? 'bg-indigo-600 text-white shadow-md' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 品牌列表：網格佈局 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mt-8">
                    {filtered.map((brand) => (
                        <div 
                            key={brand.name} 
                            onClick={() => handleBrandClick(brand.website, brand.name)}
                            className="bg-white p-4 border border-gray-200 rounded-xl shadow-md cursor-pointer 
                                hover:shadow-xl hover:border-indigo-300 transition duration-300 
                                flex flex-col items-center text-center group"
                            title={`點擊前往 ${brand.name} 官網 (類別: ${brand.category})`}
                        >
                            {/* 品牌 Logo 區域 (使用佔位符圖片) */}
                            <div className="h-10 w-full mb-3 flex items-center justify-center">
                                <img 
                                    src={brand.logoUrl} 
                                    alt={`${brand.name} Logo`} 
                                    className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition duration-300"
                                    onError={(e) => { e.target.onerror = null; e.target.src = getPlaceholderLogo(brand.name); }} 
                                />
                            </div>

                            {/* 品牌名稱與類別 */}
                            <p className="text-base font-semibold text-gray-800 truncate w-full">{brand.name}</p>
                            <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-1">
                                {brand.category}
                            </span>
                        </div>
                    ))}
                    
                    {/* 找不到品牌提示 */}
                    {filtered.length === 0 && (
                        <div className="col-span-full text-center text-gray-500 py-10">
                            找不到符合 "{query}" (類別: {activeCategory}) 的品牌。
                        </div>
                    )}
                </div>
            </div>

            {/* 自訂訊息視窗 (取代 alert) */}
            <CustomMessageBox message={message} onClose={() => setMessage('')} />
        </div>
    );
}