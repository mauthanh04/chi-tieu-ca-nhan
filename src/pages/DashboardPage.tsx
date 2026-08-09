import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Account, Category, Transaction } from '../types';
import { TodayCard } from '../components/dashboard/TodayCard';
import { MonthCalendar } from '../components/dashboard/MonthCalendar';
import { TransactionList } from '../components/transactions/TransactionList';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

interface DashboardPageProps {
  onOpenAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onRequestDeleteTransaction: (id: string) => void;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  isLoading: boolean;
  onRefreshData: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onEditTransaction,
  onRequestDeleteTransaction,
  accounts,
  categories,
  transactions,
  isLoading,
  onRefreshData,
}) => {
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate today's totals
  const todayTxs = transactions.filter((t) => t.transaction_date.startsWith(todayStr));
  const todayThu = todayTxs
    .filter((t) => t.type === 'thu')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const todayChi = todayTxs
    .filter((t) => t.type === 'chi')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Filter month transactions
  const monthTxs = transactions.filter((t) => {
    const d = new Date(t.transaction_date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const monthThu = monthTxs
    .filter((t) => t.type === 'thu')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const monthChi = monthTxs
    .filter((t) => t.type === 'chi')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const monthRemaining = monthThu - monthChi;

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  // Selected date transactions for calendar inspector
  const selectedDayTxs = selectedDate
    ? transactions.filter((t) => t.transaction_date.startsWith(selectedDate))
    : [];

  const handleMonthChange = (m: number, y: number) => {
    setCurrentMonth(m);
    setCurrentYear(y);
    setSelectedDate(null);
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <TodayCard
        todayThu={todayThu}
        todayChi={todayChi}
        monthThu={monthThu}
        monthChi={monthChi}
        monthRemaining={monthRemaining}
        totalBalance={totalBalance}
      />

      {/* Month Calendar */}
      <MonthCalendar
        currentMonth={currentMonth}
        currentYear={currentYear}
        onMonthChange={handleMonthChange}
        transactions={monthTxs}
        onSelectDate={(d) => setSelectedDate(d)}
        selectedDate={selectedDate}
        selectedDayTxs={selectedDayTxs}
        onCloseDayDetails={() => setSelectedDate(null)}
        onEditTransaction={onEditTransaction}
        onDeleteTransaction={onRequestDeleteTransaction}
      />

      {/* Monthly Transactions List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
        <TransactionList
          transactions={monthTxs}
          accounts={accounts}
          categories={categories}
          onEditTransaction={onEditTransaction}
          onDeleteTransaction={onRequestDeleteTransaction}
          title={`Giao dịch tháng ${currentMonth}/${currentYear}`}
          showFilters={true}
        />
      </div>
    </div>
  );
};
