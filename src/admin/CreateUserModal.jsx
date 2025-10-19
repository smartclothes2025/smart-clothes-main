import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import StyledButton from '../components/ui/StyledButton'; 
export default function CreateUserModal({ setShowCreateModal, createUser, newUser, setNewUser }) {

  const [show, setShow] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    if (isSaving) return; 
    setShow(false);
    setTimeout(() => {
      setShowCreateModal(false); 
    }, 300);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await createUser(); // 呼叫從 props 傳入的 createUser 函數
      handleClose(); // 成功後觸發關閉動畫
    } catch (err) {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="關閉建立帳號視窗"
      />
      
      <div 
        className={`relative bg-white rounded-2xl shadow-xl w-[min(480px,95%)] z-10 overflow-hidden transition-all duration-300 ${
          show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="p-5 bg-slate-50/50">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1.5">使用者名稱</label>
              <input 
                id="name"
                value={newUser.name} 
                onChange={e=>setNewUser({...newUser, name: e.target.value})} 
                className="form-input w-full" 
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
              <input 
                id="email"
                type="email"
                value={newUser.email} 
                onChange={e=>setNewUser({...newUser, email: e.target.value})} 
                className="form-input w-full"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-1.5">密碼</label>
              <input 
                id="password"
                type="password" 
                value={newUser.password} 
                onChange={e=>setNewUser({...newUser, password: e.target.value})} 
                className="form-input w-full"
              />
              <div className="text-xs text-gray-400 mt-1.5">密碼至少 6 碼。</div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3">
          <StyledButton onClick={handleClose} variant="outline" disabled={isSaving}>
            取消
          </StyledButton>
        
          <StyledButton onClick={handleSubmit} variant="primary" disabled={isSaving}>
            {isSaving ? '建立中...' : '建立帳號'}
          </StyledButton>
        </div>
        
      </div>
    </div>
  );
}