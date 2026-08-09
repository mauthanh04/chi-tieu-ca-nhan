import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Budget, Category } from '../../types';
import { formatCurrency, getAvailableYears } from '../../utils/formatters';
import { buildCategoryTree } from '../../utils/categoryUtils';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { category_id: string; month: number; year: number; limit_amount: number; is_rollover?: boolean; apply_all_months?: boolean }) => Promise<void>;
  onUpdate?: (id: string, data: { limit_amount: number; is_rollover?: boolean; apply_all_months?: boolean }) => Promise<void>;
  categories: Category[];
  currentMonth: number;
  currentYear: number;
  budgetToEdit?: Budget | null;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  categories,
  currentMonth,
  currentYear,
  budgetToEdit,
}) => {
  const [categoryId, setCategoryId] = useState('');
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [limitAmount, setLimitAmount] = useState('');
  const [isRollover, setIsRollover] = useState(true);
  const [applyAllMonths, setApplyAllMonths] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chiCategories = categories.filter((c) => c.type === 'chi');

  useEffect(() => {
    if (budgetToEdit) {
      setCategoryId(budgetToEdit.category_id);
      setMonth(budgetToEdit.month);
      setYear(budgetToEdit.year);
      setLimitAmount(String(budgetToEdit.limit_amount));
      setIsRollover(budgetToEdit.is_rollover ?? true);
      setApplyAllMonths(false);
    } else {
      setMonth(currentMonth);
      setYear(currentYear);
      if (chiCategories.length > 0) {
        setCategoryId(chiCategories[0].id);
      }
      setLimitAmount('');
      setIsRollover(true);
      setApplyAllMonths(false);
    }
    setError('');
  }, [isOpen, budgetToEdit, currentMonth, currentYear, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!categoryId) {
      setError('Vui lòng chọn danh mục chi tiêu');
      return;
    }

    const numLimit = Number(limitAmount);
    if (isNaN(numLimit) || numLimit <= 0) {
      setError('Hạn mức chi tiêu phải lớn hơn 0');
      return;
    }

    try {
      setIsSubmitting(true);
      if (budgetToEdit && onUpdate) {
        await onUpdate(budgetToEdit.id, {
          limit_amount: numLimit,
          is_rollover: isRollover,
          apply_all_months: applyAllMonths,
        });
      } else {
        await onSave({
          category_id: categoryId,
          month,
          year,
          limit_amount: numLimit,
          is_rollover: isRollover,
          apply_all_months: applyAllMonths,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu ngân sách');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={budgetToEdit ? 'Chỉnh sửa hạn mức ngân sách' : 'Thiết lập ngân sách mới'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-medium rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            {error}
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Danh mục chi tiêu <span className="text-rose-500">*</span>
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={!!budgetToEdit}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800/50"
            required
          >
            {buildCategoryTree(categories, 'chi').map((parent) => (
              <React.Fragment key={parent.id}>
                <option value={parent.id} className="font-bold">
                  {parent.name}
                </option>
                {parent.children.map((child) => (
                  <option key={child.id} value={child.id}>
                    &nbsp;&nbsp;&nbsp;&nbsp;└ {child.name}
                  </option>
                ))}
              </React.Fragment>
            ))}
          </select>
        </div>

        {/* Month & Year */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tháng</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Năm</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {getAvailableYears(year).map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Limit Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Hạn mức chi tiêu (VNĐ) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            placeholder="Ví dụ: 3000000"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
          {limitAmount && !isNaN(Number(limitAmount)) && Number(limitAmount) > 0 && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Gợi ý: {formatCurrency(Number(limitAmount))}
            </p>
          )}
        </div>

        {/* Rollover Toggle */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Cộng dồn tiền thừa từ tháng trước
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Tự động cộng dồn số tiền chưa chi hết của tháng trước vào hạn mức tháng này.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsRollover(!isRollover)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
              isRollover ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                isRollover ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Apply All Months Toggle */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Áp dụng cho tất cả các tháng trong năm
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Tự động áp dụng hạn mức và cài đặt này cho cả 12 tháng năm {year}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setApplyAllMonths(!applyAllMonths)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
              applyAllMonths ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                applyAllMonths ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Submit */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu ngân sách'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
