import { Bell, Calendar, User } from 'lucide-react'; 
import { Link } from 'react-router-dom';
import ThemeSelect from '../components/ThemeSelect';

export default function Header({ title, theme, setTheme }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 px-10 flex items-center justify-between bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="flex items-center gap-2">
        <img src="/穿搭醬logo.png" alt="穿搭醬 Logo" className="h-8 w-auto" />
        <h1 className="text-xl font-extrabold tracking-tight text-gray-900">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-1.5 bg-white rounded-md shadow-sm"><Calendar className="w-4 h-4 text-gray-600" /></button>
        <Bell className="w-5 h-5 text-gray-600" />
        <Link to="/settings" className="ml-2">
          <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-semibold">U</div>
        </Link>
      </div>
    </header>
  );
}
