// src/components/Layout.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import BottomNav from "./BottomNav";
import AdminSidebar from "./AdminSidebar";

export default function Layout({ children, title = "" }) {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      <Header title={title} />
      <div className="pt-14">
        {children}
        {isAdmin ? <AdminSidebar /> : <BottomNav />}
      </div>
    </>
  );
}
