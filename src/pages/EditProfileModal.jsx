import React, { useState } from "react";
import PropTypes from "prop-types";
import { XMarkIcon } from "@heroicons/react/24/outline";

// --- 在此檔案內定義專用的 UI 元件 ---
const ModalButton = ({ children, onClick, variant = "primary", type = "button", disabled = false }) => {
  const baseClasses = "px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed";
  const styles = {
    primary: "text-white bg-gradient-to-br from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform focus:outline-none focus:ring-4 focus:ring-indigo-200",
    secondary: "text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${styles[variant]}`}>
      {children}
    </button>
  );
};

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

// --- EditProfileModal 主要元件 ---
export default function EditProfileModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    displayName: user.displayName || "",
    bio: user.bio || "",
    height: user.height ?? "",
    weight: user.weight ?? "",
    bust: user.bust ?? "",
    waist: user.waist ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (err) {
      console.error("保存失敗", err);
      alert(err?.message || "儲存失敗");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-slide-up-fast">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
            <h2 className="text-lg font-bold text-slate-800">編輯個人檔案</h2>
            <button type="button" onClick={onClose} className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 bg-slate-50/50 flex-grow overflow-y-auto space-y-5">
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
              <div className="grid grid-cols-2 gap-4">
                <FormField label="身高" name="height" type="number" value={formData.height} onChange={handleChange} unit="cm" />
                <FormField label="體重" name="weight" type="number" value={formData.weight} onChange={handleChange} unit="kg" />
                <FormField label="胸圍" name="bust" type="number" value={formData.bust} onChange={handleChange} unit="cm" />
                <FormField label="腰圍" name="waist" type="number" value={formData.waist} onChange={handleChange} unit="cm" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
            <ModalButton type="button" variant="secondary" onClick={onClose} disabled={isSaving}>取消</ModalButton>
            <ModalButton type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? '儲存中...' : '儲存變更'}
            </ModalButton>
          </div>
        </form>
      </div>
    </div>
  );
};

ModalButton.propTypes = { children: PropTypes.node, onClick: PropTypes.func, variant: PropTypes.oneOf(["primary", "secondary"]), type: PropTypes.string, disabled: PropTypes.bool };
FormField.propTypes = { label: PropTypes.string.isRequired, name: PropTypes.string.isRequired, type: PropTypes.string, value: PropTypes.any, onChange: PropTypes.func, placeholder: PropTypes.string, unit: PropTypes.string };
EditProfileModal.propTypes = { user: PropTypes.object.isRequired, onClose: PropTypes.func.isRequired, onSave: PropTypes.func.isRequired };