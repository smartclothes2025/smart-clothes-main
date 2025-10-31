import React, { useEffect, useState } from 'react';
import StyledButton from '../ui/StyledButton';

const CloseIcon = ({ onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
    >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    </button>
);

const FormField = ({ label, name, type = "text", value, onChange, placeholder }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <div className="relative">
            <input
                id={name}
                name={name}
                type={type}
                value={value ?? ""}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-white shadow-inner focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition"
            />
        </div>
    </div>
);

export default function EditClothModal({ open, item, onClose, onSaved, apiBase }) {
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        color: "",
        material: "",
        style: "",
        size: "",
        brand: "",
        tags: "",
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (open) {
            const timer = setTimeout(() => setShow(true), 10);
            if (item) {
                setFormData({
                    name: item.name || '',
                    category: item.category || '',
                    material: item.material || '',
                    style: item.style || '',
                    size: item.size || '',
                    brand: item.brand || '',
                    // tags stored as comma-separated string in the form
                    tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
                });
                setError('');
            }
            return () => clearTimeout(timer);
        } else {
            setShow(false);
        }
    }, [open, item]);

    if (!open) return null;

    const token = localStorage.getItem('token') || '';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 下拉選單選項
    const CATEGORY_OPTIONS = [
        '上衣','褲子','裙子','洋裝','外套','鞋子','帽子','包包','配件','襪子'
    ];

    const handleClose = () => {
        if (saving) return;
        setShow(false);
        setTimeout(() => onClose(), 300);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (saving) return;

        if (!formData.name.trim()) {
            setError('請輸入衣物名稱');
            return;
        }

        setSaving(true);
        setError('');

        try {
            // ✅ 修正：直接構建 payload，不需要包裝在 update_data 中
            const payload = {};

            // 只添加有值的欄位
            if (formData.name?.trim()) payload.name = formData.name.trim();
            if (formData.category?.trim()) payload.category = formData.category.trim();
            if (formData.color?.trim()) payload.color = formData.color.trim();
            if (formData.style?.trim()) payload.style = formData.style.trim();
            if (formData.brand?.trim()) payload.brand = formData.brand.trim();

            // 處理 attributes (將 material 和 size 放入 attributes)
            const attributes = {};
            if (formData.material?.trim()) attributes.material = formData.material.trim();
            if (formData.size?.trim()) attributes.size = formData.size.trim();
            if (Object.keys(attributes).length > 0) {
                payload.attributes = attributes;
            }

            console.log('準備更新衣物:', item.id, payload);

            const url = `${apiBase}/clothes/${item.id}`;
            console.log('完整 URL:', url);
            console.log('Token:', token ? `${token.substring(0, 20)}...` : '無 token');

            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };

            // 處理 tags：由逗號分隔字串轉成陣列
            if (formData.tags?.trim()) {
                const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
                if (tagsArray.length > 0) payload.tags = tagsArray;
            }
            console.log('請求 headers:', headers);
            console.log('請求 body:', JSON.stringify(payload));

            // ✅ 直接發送 payload，不包裝
            const res = await fetch(url, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(payload)
            });

            console.log('回應狀態:', res.status, res.statusText);

            if (!res.ok) {
                // 先讀取回應文本
                const responseText = await res.text();
                console.error('錯誤回應原始文本:', responseText);

                // 嘗試解析為 JSON
                let errorData = null;
                try {
                    errorData = JSON.parse(responseText);
                } catch (e) {
                    console.error('無法解析錯誤回應為 JSON');
                }

                console.error('更新失敗:', res.status, errorData);

                if (res.status === 405) {
                    throw new Error('後端未提供衣物更新 API（PATCH/PUT）。請聯繫管理員。');
                } else if (res.status === 404) {
                    throw new Error('找不到該衣物，可能已被刪除。');
                } else if (res.status === 403) {
                    throw new Error('沒有權限編輯此衣物。');
                } else if (res.status === 422) {
                    const detail = errorData?.detail;
                    if (Array.isArray(detail)) {
                        const msgs = detail.map(d => d.msg || '未知錯誤').join(', ');
                        throw new Error(`資料驗證失敗: ${msgs}`);
                    }
                    throw new Error(errorData?.detail || '資料格式錯誤');
                }

                throw new Error(errorData?.detail || errorText || `更新失敗（${res.status}）`);
            }

            const result = await res.json();
            console.log('更新成功:', result);

            // 使用後端返回的更新後資料
            const updatedItem = result.item || result;

            onSaved && onSaved(updatedItem);
            handleClose();

        } catch (e) {
            console.error("儲存失敗", e);
            setError(e?.message || "儲存失敗，請稍後再試。");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className={`fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-2 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleClose}
        >
            <div
                className={`bg-white rounded-3xl shadow-2xl w-[92vw] max-w-md max-h-[100vh] overflow-hidden flex flex-col transition-all duration-300 ease-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSave} className="flex flex-col h-full">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                        <h2 className="text-xl font-bold text-slate-900">✨ 編輯衣物資料</h2>
                        <CloseIcon onClick={handleClose} />
                    </div>

                    <div className="p-4 bg-neutral-50 flex-grow overflow-y-auto space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-indigo-600 border-b-2 border-indigo-200 pb-2 mb-4">基本資訊</h3>
                            <div className="mb-4">
                                <FormField
                                    label="衣物名稱 (必填)"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">類別</label>
                                    <div>
                                        <select
                                            id="category"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            className="w-full border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition"
                                        >
                                            <option value="">選擇類別</option>
                                            {CATEGORY_OPTIONS.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <FormField
                                    label="品牌"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <FormField
                                    label="顏色"
                                    name="color"
                                    value={formData.color}
                                    onChange={handleChange}
                                />
                                <FormField
                                    label="風格"
                                    name="style"
                                    value={formData.style}
                                    onChange={handleChange}
                                />    
                            </div>
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 p-3 bg-red-100 border border-red-300 rounded-lg">
                                <strong>儲存錯誤：</strong> {error}
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-4 flex-shrink-0">
                        <StyledButton type="button" variant="secondary" onClick={handleClose} disabled={saving}>
                            取消
                        </StyledButton>
                        <StyledButton type="submit" variant="primary" disabled={saving}>
                            {saving ? '儲存中...' : '儲存變更'}
                        </StyledButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
