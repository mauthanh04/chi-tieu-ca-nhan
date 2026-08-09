import React from 'react';
import { Moon, Sun, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  title: string;
  onOpenAddTransaction: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { logout } = useAuth();
  const { themeMode, setThemeMode } = useTheme();

  const toggleTheme = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="sticky top-0 z-20 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/80 px-4 sm:px-8 py-4 flex items-center justify-between">
      {/* Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Logo */}
        <div className="lg:hidden w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
          <Wallet className="w-4 h-4" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h2>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Giao diện: ${themeMode === 'light' ? 'Sáng' : 'Tối'}`}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {themeMode === 'light' ? (
            <Sun className="w-5 h-5 text-amber-500" />
          ) : (
            <Moon className="w-5 h-5 text-blue-400" />
          )}
        </button>

        {/* Mobile Logout */}
        <button
          onClick={logout}
          title="Đăng xuất"
          className="lg:hidden p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
