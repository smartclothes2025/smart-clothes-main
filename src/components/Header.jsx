import { Bell, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeSelect from '../components/ThemeSelect';


export default function Header({ title, theme, setTheme }) {
  return (
    <header className="px-4 pt-6 pb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src="/public/穿搭醬logo.png" alt="穿搭醬 Logo" className="h-12 w-auto" />
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 bg-white rounded-lg shadow-sm"><Calendar className="w-5 h-5 text-gray-600" /></button>
        <Bell className="w-6 h-6 text-gray-600" />
        <Link to="/settings" className="ml-2">
          <div className="w-9 h-9 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-semibold">U</div>
        </Link>
      </div>
    </header>
  );
}
