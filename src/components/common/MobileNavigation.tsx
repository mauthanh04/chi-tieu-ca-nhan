import React from 'react';
import { LayoutDashboard, BarChart3, CreditCard, Target, Settings, Plus } from 'lucide-react';

interface MobileNavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAddTransaction: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddTransaction,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Trang chính', icon: LayoutDashboard },
    { id: 'statistics', label: 'Thống kê', icon: BarChart3 },
    { id: 'accounts', label: 'Tài khoản', icon: CreditCard },
    { id: 'budgets', label: 'Ngân sách', icon: Target },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <div className="lg:hidden">
      {/* Floating Action Button (FAB) */}
      <button
        onClick={onOpenAddTransaction}
        className="fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/30 flex items-center justify-center active:scale-95 transition-all"
        aria-label="Thêm giao dịch"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
