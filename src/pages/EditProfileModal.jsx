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
    sex: user.sex || "", // 從 user 讀取 sex
  });
  const [isSaving, setIsSaving] = useState(false);
  const [show, setShow] = useState(false);

  // 除錯：查看 user 物件中的 sex 值
  useEffect(() => {
    console.log('EditProfileModal 收到的 user 資料:', user);
    console.log('user.sex:', user.sex);
  }, [user]);

  // 當 user prop 變更時，更新 formData
  useEffect(() => {
    setFormData({
      displayName: user.displayName || "",
      bio: user.bio || "",
      height: user.height ?? "",
      weight: user.weight ?? "",
      bust: user.bust ?? "",
      waist: user.waist ?? "",
      hip: user.hip ?? "",
      shoulder: user.shoulder ?? "",
      sex: user.sex || "",
    });
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    if (isSaving) return;
    setShow(false);
    setTimeout(() => onClose(), 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    try {
      // 呼叫父層 onSave 傳表單資料（包含 sex）
      await onSave(formData);

      // 關閉 modal（含離開動畫）
      handleClose();

    } catch (err) {
      console.error("保存失敗", err);
      alert(err?.message || "儲存失敗");
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-2 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-[92vw] max-w-md max-h-[100vh] overflow-hidden flex flex-col transition-all duration-300 ease-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
            <h2 className="text-lg font-bold text-slate-800">編輯個人檔案</h2>
            <button type="button" onClick={handleClose} className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 bg-slate-50/50 flex-grow overflow-y-auto space-y-4">
            <div>
              <div className="space-y-4">
                <FormField label="顯示名稱" name="displayName" value={formData.displayName} onChange={handleChange} placeholder="您的暱稱" />
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-slate-600 mb-1">個人簡介</label>
                  <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} rows="3" placeholder="介紹一下自己吧！" className="w-full border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition"></textarea>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-500 border-b pb-2 mb-4">穿搭數據</h3>
              
              {/* 性別選擇 - 移到最上方更顯眼 */}
              <div className="mb-4">
                <label htmlFor="sex" className="block text-sm font-medium text-slate-600 mb-1">性別</label>
                <select
                  id="sex"
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition appearance-none bg-white pr-8 bg-no-repeat bg-right bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3e%3c/svg%3e')]"
                >
                  <option value="">選擇性別</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              {/* 身體數據 */}
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
}

FormField.propTypes = { label: PropTypes.string.isRequired, name: PropTypes.string.isRequired, type: PropTypes.string, value: PropTypes.any, onChange: PropTypes.func, placeholder: PropTypes.string, unit: PropTypes.string };
EditProfileModal.propTypes = { user: PropTypes.object.isRequired, onClose: PropTypes.func.isRequired, onSave: PropTypes.func.isRequired };
