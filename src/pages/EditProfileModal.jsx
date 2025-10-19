import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { XMarkIcon } from "@heroicons/react/24/outline";
import StyledButton from "../components/ui/StyledButton";
const FormField = ({ label, name, type = "text", value, onChange, placeholder, unit }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
    <div className="relative">
      <input
        id={name}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition ${unit ? 'pr-12' : ''}`}
      />
      {unit && <span className="absolute inset-y-0 right-4 flex items-center text-sm text-slate-400">{unit}</span>}
    </div>
  </div>
);

export default function EditProfileModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    displayName: user.displayName || "",
    bio: user.bio || "",
    height: user.height ?? "",
    weight: user.weight ?? "",
    bust: user.bust ?? "",
    waist: user.waist ?? "",
    hip: user.hip ?? "",
    shoulder: user.shoulder ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // [!!] 新增一個 'show' 狀態來控制過渡
  const [show, setShow] = useState(false);

  // [!!] 使用 useEffect 來觸發「進入」動畫
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, 10); // 10 毫秒延遲

    // 元件卸載時清除計時器
    return () => clearTimeout(timer);
  }, []); // [] 空依賴陣列，確保只在掛載時執行一次

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      // [!!] 儲存成功後，呼叫 handleClose 觸發離開動畫
      handleClose();
    } catch (err) {
      console.error("保存失敗", err);
      alert(err?.message || "儲存失敗");
      setIsSaving(false); // 失敗時要重設儲存狀態
    }
  };

  // [!!] 建立一個新的 handleClose 函數
  const handleClose = () => {
    if (isSaving) return; // 正在儲存時，防止關閉

    // 1. 將 show 設為 false，觸發「離開」過渡動畫
    setShow(false);

    // 2. 設定一個計時器，等待動畫播放完畢
    //    (300ms 必須匹配 CSS 過渡時間 duration-300)
    setTimeout(() => {
      onClose(); // 3. 動畫播完後，才真正呼叫父元件的 onClose 函數
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-2 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'
        }`}
      onClick={handleClose} // 點擊背景時呼叫 handleClose
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-[92vw] max-w-md max-h-[100vh] overflow-hidden flex flex-col transition-all duration-300 ease-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4' // 進入時上滑，離開時下滑
          }`}
        onClick={(e) => e.stopPropagation()} // 阻止事件冒泡
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
            <h2 className="text-lg font-bold text-slate-800">編輯個人檔案</h2>
            {/* [!!] 將 onClick 改為呼叫 handleClose */}
            <button type="button" onClick={handleClose} className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* --- (表單內容完全不變) --- */}
          <div className="p-4 bg-slate-50/50 flex-grow overflow-y-auto space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 border-b pb-2 mb-4">公開資訊</h3>
              <div className="space-y-4">
                <FormField label="顯示名稱" name="displayName" value={formData.displayName} onChange={handleChange} placeholder="您的暱稱" />
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-slate-600 mb-1">個人簡介</label>
                  <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} rows="3" placeholder="介紹一下自己吧！" className="w-full border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition"></textarea>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-500 border-b pb-2 mb-4">穿搭數據 (選填)</h3>
              <div className="grid grid-cols-3 gap-3">
                <FormField label="身高" name="height" type="number" value={formData.height} onChange={handleChange} unit="cm" />
                <FormField label="體重" name="weight" type="number" value={formData.weight} onChange={handleChange} unit="kg" />
                <FormField label="胸圍" name="bust" type="number" value={formData.bust} onChange={handleChange} unit="cm" />
                <FormField label="腰圍" name="waist" type="number" value={formData.waist} onChange={handleChange} unit="cm" />
                <FormField label="臀圍" name="hip" type="number" value={formData.hip} onChange={handleChange} unit="cm" />
                <FormField label="肩寬" name="shoulder" type="number" value={formData.shoulder} onChange={handleChange} unit="cm" />
              </div>
            </div>
          </div>

          <div className="p-3 bg-white border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
            <StyledButton type="button" variant="secondary" onClick={handleClose} disabled={isSaving}>取消</StyledButton>
            <StyledButton type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? '儲存中...' : '儲存變更'}
            </StyledButton>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- PropTypes (保持不變) ---
FormField.propTypes = { label: PropTypes.string.isRequired, name: PropTypes.string.isRequired, type: PropTypes.string, value: PropTypes.any, onChange: PropTypes.func, placeholder: PropTypes.string, unit: PropTypes.string };
EditProfileModal.propTypes = { user: PropTypes.object.isRequired, onClose: PropTypes.func.isRequired, onSave: PropTypes.func.isRequired };