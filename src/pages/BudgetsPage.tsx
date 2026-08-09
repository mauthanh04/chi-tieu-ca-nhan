import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Budget, Category } from '../types';
import { formatCurrency, getAvailableYears } from '../utils/formatters';
import { BudgetModal } from '../components/budgets/BudgetModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Target, Plus, Edit2, Trash2, ShieldAlert, RotateCcw, ArrowUpRight, CalendarRange } from 'lucide-react';

interface BudgetsPageProps {
  categories: Category[];
}

export const BudgetsPage: React.FC<BudgetsPageProps> = ({ categories }) => {
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [isRolloverEnabled, setIsRolloverEnabled] = useState<boolean>(true);

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    fetchBudgets();
  }, [currentMonth, currentYear, isRolloverEnabled]);

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBudgets(currentMonth, currentYear, isRolloverEnabled);
      setBudgets(res.budgets);
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBudget = async (data: { category_id: string; month: number; year: number; limit_amount: number; is_rollover?: boolean; apply_all_months?: boolean }) => {
    await api.createBudget(data);
    await fetchBudgets();
  };

  const handleUpdateBudget = async (id: string, data: { limit_amount: number; is_rollover?: boolean; apply_all_months?: boolean }) => {
    await api.updateBudget(id, data);
    await fetchBudgets();
  };

  const handleApplyToAllMonths = async (b: Budget) => {
    try {
      await api.updateBudget(b.id, {
        limit_amount: b.limit_amount,
        is_rollover: b.is_rollover,
        apply_all_months: true,
      });
      await fetchBudgets();
    } catch (err) {
      console.error('Failed to apply to all months:', err);
    }
  };

  const handleDeleteBudget = async () => {
    if (!deletingBudgetId) return;
    try {
      setIsDeleting(true);
      await api.deleteBudget(deletingBudgetId);
      setDeletingBudgetId(null);
      await fetchBudgets();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper function to pick progress details
  const getProgressDetails = (percentage: number) => {
    if (percentage >= 100) {
      return {
        barColor: 'bg-rose-600',
        badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300',
        badgeText: 'Đã vượt ngân sách',
        isExceeded: true,
        isWarning: true,
      };
    }
    if (percentage >= 90) {
      return {
        barColor: 'bg-orange-500',
        badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300',
        badgeText: 'Cảnh báo mạnh (>90%)',
        isExceeded: false,
        isWarning: true,
      };
    }
    if (percentage >= 70) {
      return {
        barColor: 'bg-amber-500',
        badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300',
        badgeText: 'Cảnh báo (>70%)',
        isExceeded: false,
        isWarning: true,
      };
    }
    return {
      barColor: 'bg-blue-600',
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200',
      badgeText: 'An toàn',
      isExceeded: false,
      isWarning: false,
    };
  };

  // Calculated Overall Totals
  const totalBaseLimit = budgets.reduce((sum, b) => sum + Number(b.limit_amount || 0), 0);
  const totalRollover = budgets.reduce((sum, b) => sum + Number(b.rollover_amount || 0), 0);
  const totalLimit = budgets.reduce((sum, b) => sum + Number(b.effective_limit ?? b.limit_amount ?? 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent || 0), 0);
  const totalRemaining = totalLimit - totalSpent;
  const overallPercentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  const warningBudgets = budgets.filter((b) => (b.percentage || 0) >= 70);

  return (
    <div className="space-y-6">
      {/* Header & Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Hạn mức ngân sách tháng {currentMonth}/{currentYear}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Theo dõi tiến độ chi tiêu theo danh mục để không bị vượt hạn mức
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRolloverEnabled(!isRolloverEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isRolloverEnabled
                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            }`}
            title="Bật/tắt tự động cộng dồn tiền còn dư từ tháng trước vào hạn mức"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRolloverEnabled ? 'text-blue-600 dark:text-blue-400' : ''}`} />
            <span>Cộng dồn tiền thừa: <strong>{isRolloverEnabled ? 'BẬT' : 'TẮT'}</strong></span>
          </button>

          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>

          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
          >
            {getAvailableYears(currentYear).map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setEditingBudget(null);
              setIsModalOpen(true);
            }}
            className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm ngân sách</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      {budgets.length > 0 && !isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">Tổng ngân sách khả dụng</span>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalLimit)}</div>
            {totalRollover > 0 && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 pt-0.5">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                Gồm +{formatCurrency(totalRollover)} cộng dồn tháng trước
              </p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">Tổng thực tế đã chi</span>
            <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(totalSpent)} ({overallPercentage}%)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">Tổng ngân sách còn lại</span>
            <div
              className={`text-lg font-bold ${
                totalRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {totalRemaining < 0
                ? `Vượt ${formatCurrency(Math.abs(totalRemaining))}`
                : formatCurrency(totalRemaining)}
            </div>
          </div>
        </div>
      )}

      {/* Active Warnings Banner */}
      {warningBudgets.length > 0 && !isLoading && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-amber-900 dark:text-amber-200">
              Cảnh báo hạn mức ngân sách ({warningBudgets.length} danh mục chạm ngưỡng):
            </h4>
            <div className="flex flex-wrap gap-2 pt-1">
              {warningBudgets.map((wb) => {
                const perc = wb.percentage || 0;
                const effLimit = wb.effective_limit ?? wb.limit_amount;
                return (
                  <span
                    key={wb.id}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border ${
                      perc >= 100
                        ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200'
                        : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200'
                    }`}
                  >
                    {wb.category_name}: {perc}% ({formatCurrency(wb.spent || 0)} / {formatCurrency(effLimit)})
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Budget Cards List */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : budgets.length === 0 ? (
        <EmptyState
          title={`Chưa có ngân sách cho tháng ${currentMonth}/${currentYear}`}
          description="Thiết lập hạn mức ngân sách cho từng danh mục để kiểm soát tài chính tối ưu."
          actionLabel="Tạo ngân sách đầu tiên"
          onAction={() => {
            setEditingBudget(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const spent = b.spent || 0;
            const effectiveLimit = b.effective_limit ?? b.limit_amount;
            const remaining = b.remaining !== undefined ? b.remaining : effectiveLimit - spent;
            const percentage = b.percentage || 0;
            const details = getProgressDetails(percentage);
            const rolloverAmount = b.rollover_amount || 0;

            return (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                      {b.category_name}
                    </h4>
                    <span
                      className={`inline-block mt-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${details.badgeColor}`}
                    >
                      {details.badgeText}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleApplyToAllMonths(b)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                      title={`Áp dụng hạn mức ${formatCurrency(b.limit_amount)} cho cả 12 tháng năm ${currentYear}`}
                    >
                      <CalendarRange className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingBudget(b);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Sửa ngân sách"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingBudgetId(b.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Xóa ngân sách"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Đã chi: {formatCurrency(spent)}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {percentage}% ({formatCurrency(effectiveLimit)})
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${details.barColor}`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>

                  {rolloverAmount > 0 && (
                    <div className="flex items-center justify-between text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900 mt-1">
                      <span className="flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                        Cộng dồn từ tháng trước:
                      </span>
                      <span className="font-bold">+{formatCurrency(rolloverAmount)}</span>
                    </div>
                  )}
                </div>

                {/* Remaining Info */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Còn lại:</span>
                  <span
                    className={`font-bold ${
                      remaining >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {remaining < 0 ? `Vượt ${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        onSave={handleCreateBudget}
        onUpdate={handleUpdateBudget}
        categories={categories}
        currentMonth={currentMonth}
        currentYear={currentYear}
        budgetToEdit={editingBudget}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingBudgetId}
        onClose={() => setDeletingBudgetId(null)}
        onConfirm={handleDeleteBudget}
        message="Bạn có chắc chắn muốn xóa ngân sách này?"
        isLoading={isDeleting}
      />
    </div>
  );
};

