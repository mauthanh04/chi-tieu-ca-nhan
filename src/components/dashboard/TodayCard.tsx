import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { ArrowUpRight, ArrowDownRight, Wallet, PiggyBank, Calendar } from 'lucide-react';

interface OverviewProps {
  todayThu: number;
  todayChi: number;
  monthThu: number;
  monthChi: number;
  monthRemaining: number;
  totalBalance: number;
}

export const TodayCard: React.FC<OverviewProps> = ({
  todayThu,
  todayChi,
  monthThu,
  monthChi,
  monthRemaining,
  totalBalance,
}) => {
  return (
    <div className="space-y-4">
      {/* Today Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Thu Hôm Nay */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/60 dark:to-emerald-900/30 border border-emerald-200/80 dark:border-emerald-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Thu Hôm Nay
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
            +{formatCurrency(todayThu)}
          </p>
        </div>

        {/* Chi Hôm Nay */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/60 dark:to-rose-900/30 border border-rose-200/80 dark:border-rose-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Chi Hôm Nay
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400">
            -{formatCurrency(todayChi)}
          </p>
        </div>
      </div>

      {/* Monthly Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thu Nhập Tháng */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Thu nhập tháng</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(monthThu)}
          </p>
        </div>

        {/* Chi Tiêu Tháng */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Chi tiêu tháng</p>
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(monthChi)}
          </p>
        </div>

        {/* Còn Lại */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
            <PiggyBank className="w-3.5 h-3.5 text-blue-500" />
            Còn lại
          </p>
          <p
            className={`text-lg font-bold ${
              monthRemaining >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(monthRemaining)}
          </p>
        </div>

        {/* Tổng Số Dư */}
        <div className="p-4 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
          <p className="text-xs font-medium text-blue-100 mb-1 flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5" />
            Tổng số dư
          </p>
          <p className="text-lg font-bold">{formatCurrency(totalBalance)}</p>
        </div>
      </div>
    </div>
  );
};
