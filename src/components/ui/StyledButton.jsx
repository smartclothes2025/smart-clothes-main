import React from "react";
import PropTypes from "prop-types";

// 這個按鈕元件現在可以被任何頁面重複使用
export default function StyledButton({ children, onClick, variant = "primary", className = "", type = "button", disabled = false }) {
  const baseClasses = "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60";
  
  const styles = {
    primary: "text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-md transform hover:-translate-y-px",
    secondary: "text-slate-700 bg-white border border-slate-300 hover:bg-slate-50",
  };

  const applied = styles[variant] || styles.primary;

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${applied} ${className}`}>
      {children}
    </button>
  );
};

StyledButton.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(["primary", "secondary"]),
  className: PropTypes.string,
  type: PropTypes.string,
  disabled: PropTypes.bool,
};