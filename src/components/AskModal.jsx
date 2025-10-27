import React, { useState, useEffect } from 'react'
import StyledButton from './ui/StyledButton'
import { Icon } from '@iconify/react'

export default function AskModal({
  open = false,
  title = '確認',
  message = '',
  confirmText = '確定',
  cancelText = '取消',
  destructive = false,
  onConfirm = () => {},
  onCancel = () => {},
}) {
  // hooks 必須在函式頂端呼叫，不能在條件之後
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 當 open 為 true 時做進場動畫；當 open 為 false 時確保隱藏
    if (!open) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(t);
  }, [open]);

  // 若沒有 open 直接不 render
  if (!open) return null;

  const handleClose = () => {
    setShow(false);
    setTimeout(() => onCancel(), 200);
  };

  const handleConfirm = () => {
    setShow(false);
    setTimeout(() => onConfirm(), 200);
  };

  const iconName = destructive ? 'mdi:alert-circle-outline' : 'mdi:help-circle-outline';
  const iconColorClass = destructive ? 'text-red-600' : 'text-blue-600';
  const iconBgClass = destructive ? 'bg-red-100' : 'bg-blue-100';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}>
      <button type="button" className="absolute inset-0 bg-black/40" onClick={handleClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white rounded-2xl shadow-xl z-10 w-[min(420px,94%)] overflow-hidden transition-all duration-200 ease-out ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <div className="p-6 flex">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${iconBgClass}`}>
            <Icon icon={iconName} className={`w-6 h-6 ${iconColorClass}`} />
          </div>
          <div className="flex-grow"> 
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600 text-center">{message}</p> 
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-4 flex justify-end gap-3 rounded-b-xl">
          <StyledButton variant={destructive ? 'destructive' : 'primary'} onClick={handleConfirm}>{confirmText}</StyledButton>
          <StyledButton variant="secondary" onClick={handleClose}>{cancelText}</StyledButton>
        </div>
      </div>
    </div>
  );
}