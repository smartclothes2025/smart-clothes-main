// src/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// 🔑 這裡填你的 Firebase 專案設定
const firebaseConfig = {
  apiKey: "AIzaSyAAGwzGIIdjJcXtod2p8navUgNl-rz0aKs",
  authDomain: "online-closet-5293f.firebaseapp.com",
  projectId: "online-closet-5293f",
  storageBucket: "online-closet-5293f.firebasestorage.app",
  messagingSenderId: "153969239462",
  appId: "1:153969239462:web:05b4956d11d60e71769b67",
};

// 避免重複初始化
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// 🔹 取得 Firebase Auth 實例
const auth = getAuth(app);

export { auth };
