// src/components/Layout.jsx
import React from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import AdminSidebar from './AdminSidebar'; // 可選

export default function Layout({ children, theme, setTheme, userRole, title = '' }) {
  const showAdminBottom = userRole === 'admin';

  return (
    <>
      <Header title={title} />
      <div className="pt-14">
        {children}
      </div>
      {showAdminBottom ? <AdminSidebar /> : <BottomNav />}
    </>
  );
}
