import { Link } from 'react-router-dom';
import {
  PaperClipIcon,
  CameraIcon,
  MicrophoneIcon,
  ArrowUpCircleIcon,
  Cog6ToothIcon,
  CalendarIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

export default function Header({ title, user }) {
  // try prop first, then fallback to localStorage-stored user
  let currentUser = user;
  if (!currentUser) {
    try {
      currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    } catch (e) {
      currentUser = null;
    }
  }

  const rawName = (currentUser?.displayName || currentUser?.display_name || currentUser?.name || currentUser?.email || "").toString();
  const avatarChar = (rawName.trim().charAt(0) || "?").toUpperCase();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 px-4 flex items-center justify-between bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="flex items-center gap-2">
        <img src="/穿搭醬logo.png" alt="穿搭醬 Logo" className="h-8 w-auto" />
        <h1 className="text-xl font-extrabold tracking-tight text-gray-900">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/wardrobe?tab=穿搭日記" className="ml-2">
          <CalendarIcon className="w-5 h-5" />
        </Link>
        <Link to="/notice" className="ml-2">
          <BellIcon className="w-5 h-5" />
        </Link>
        <Link to="/settings" className="ml-2">
          <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-semibold">{avatarChar}</div>
        </Link>
      </div>
    </header>
  );
}

              