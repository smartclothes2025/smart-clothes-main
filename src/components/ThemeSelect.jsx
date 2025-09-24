// src/components/ThemeSelect.jsx
import { ChevronDown } from 'lucide-react';
import { useMemo } from 'react';

const OPTIONS = [
  { value: 'light', label: '淺色', color: '#ffffff' },
  { value: 'dark', label: '深色', color: '#0f172a' },
  { value: 'cupcake', label: '粉色', color: '#fbe7f2' },
];

export default function ThemeSelect({ theme, setTheme }) {
  const current = useMemo(() => OPTIONS.find((o) => o.value === theme) || OPTIONS[0], [theme]);

  return (
    <div className="w-44">
      <label htmlFor="theme-select" className="sr-only">主題</label>

      <div className="relative">
        <span
          aria-hidden
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-sm"
          style={{ background: current.color }}
        />

        <select
          id="theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="block w-full appearance-none bg-gray-100 border border-gray-300 text-sm rounded-lg py-2 pl-10 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"

        >
          {OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
      </div>
    </div>
  );
}
