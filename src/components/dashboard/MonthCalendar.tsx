import React from 'react';
import { Transaction } from '../../types';
import { formatCurrency, formatDateVN, getAvailableYears } from '../../utils/formatters';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Edit2, Trash2 } from 'lucide-react';

interface MonthCalendarProps {
  currentMonth: number;
  currentYear: number;
  onMonthChange: (month: number, year: number) => void;
  transactions: Transaction[];
  onSelectDate: (dateStr: string) => void;
  selectedDate: string | null;
  selectedDayTxs: Transaction[];
  onCloseDayDetails: () => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  currentMonth,
  currentYear,
  onMonthChange,
  transactions,
  onSelectDate,
  selectedDate,
  selectedDayTxs,
  onCloseDayDetails,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const weekDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

  // Navigate month
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      onMonthChange(12, currentYear - 1);
    } else {
      onMonthChange(currentMonth - 1, currentYear);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      onMonthChange(1, currentYear + 1);
    } else {
      onMonthChange(currentMonth + 1, currentYear);
    }
  };

  const handleResetToToday = () => {
    const today = new Date();
    onMonthChange(today.getMonth() + 1, today.getFullYear());
  };

  // Build calendar matrix
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Get weekday of 1st day (0 is Sunday, 1 is Monday... convert to Mon-first: Mon=0 ... Sun=6)
  let firstDayWeekIndex = firstDayOfMonth.getDay() - 1;
  if (firstDayWeekIndex < 0) firstDayWeekIndex = 6;

  const calendarDays = [];
  // Padding empty cells before month start
  for (let i = 0; i < firstDayWeekIndex; i++) {
    calendarDays.push(null);
  }
  // Month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Calculate day totals map for performance
  const dayTotalsMap = new Map<string, { thu: number; chi: number; count: number }>();

  transactions.forEach((tx) => {
    const dateKey = tx.transaction_date.split('T')[0];
    const current = dayTotalsMap.get(dateKey) || { thu: 0, chi: 0, count: 0 };
    if (tx.type === 'thu') {
      current.thu += Number(tx.amount);
    } else {
      current.chi += Number(tx.amount);
    }
    current.count += 1;
    dayTotalsMap.set(dateKey, current);
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper short formatter (e.g. 500000 -> +500K)
  const formatShortAmount = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${Math.round(val / 1000)}K`;
    return `${val}`;
  };

  // Selected Day summary
  const selectedThuTotal = selectedDayTxs
    .filter((t) => t.type === 'thu')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const selectedChiTotal = selectedDayTxs
    .filter((t) => t.type === 'chi')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 space-y-4 shadow-sm">
      {/* Calendar Header / Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Lịch giao dịch - Tháng {currentMonth}/{currentYear}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Dropdown */}
          <select
            value={currentMonth}
            onChange={(e) => onMonthChange(Number(e.target.value), currentYear)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>

          {/* Year Dropdown */}
          <select
            value={currentYear}
            onChange={(e) => onMonthChange(currentMonth, Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
          >
            {getAvailableYears(currentYear).map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>

          <button
            onClick={handleResetToToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Hôm nay
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((wd) => (
          <div
            key={wd}
            className="py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return <div key={`empty_${idx}`} className="h-16 sm:h-20 rounded-xl bg-slate-50/40 dark:bg-slate-950/20 opacity-30" />;
          }

          const dayFormatted = String(day).padStart(2, '0');
          const monthFormatted = String(currentMonth).padStart(2, '0');
          const dateStr = `${currentYear}-${monthFormatted}-${dayFormatted}`;

          const dayData = dayTotalsMap.get(dateStr);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`h-16 sm:h-20 p-1 sm:p-2 rounded-xl border flex flex-col justify-between items-stretch text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 ring-2 ring-blue-500/20'
                  : isToday
                  ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20'
                  : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900'
              }`}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    isToday
                      ? 'w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px]'
                      : isSelected
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {dayFormatted}
                </span>

                {dayData && dayData.count > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                )}
              </div>

              {/* Thu / Chi Badges */}
              <div className="space-y-0.5 overflow-hidden">
                {dayData && dayData.thu > 0 && (
                  <div className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 truncate leading-tight">
                    +{formatShortAmount(dayData.thu)}
                  </div>
                )}
                {dayData && dayData.chi > 0 && (
                  <div className="text-[9px] sm:text-[10px] font-bold text-rose-600 dark:text-rose-400 truncate leading-tight">
                    -{formatShortAmount(dayData.chi)}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Details Panel */}
      {selectedDate && (
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-fade-in space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Chi tiết ngày {formatDateVN(selectedDate)}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedDayTxs.length} giao dịch
              </p>
            </div>
            <button
              onClick={onCloseDayDetails}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedDayTxs.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-2 text-center">
              Không có giao dịch nào trong ngày này.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {selectedDayTxs.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs"
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {tx.content || tx.category_name}
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0">({tx.category_name})</span>
                    </div>
                    {tx.account_name && (
                      <div className="text-[10px] text-slate-400 truncate">
                        Tài khoản: {tx.account_name}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-bold ${
                        tx.type === 'thu' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'thu' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>

                    <div className="flex items-center gap-1 border-l border-slate-100 dark:border-slate-800 pl-1.5">
                      {onEditTransaction && (
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Sửa giao dịch"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeleteTransaction && (
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Xóa giao dịch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Day Totals Summary */}
          {selectedDayTxs.length > 0 && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-600 dark:text-emerald-400">
                Tổng thu: +{formatCurrency(selectedThuTotal)}
              </span>
              <span className="text-rose-600 dark:text-rose-400">
                Tổng chi: -{formatCurrency(selectedChiTotal)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
