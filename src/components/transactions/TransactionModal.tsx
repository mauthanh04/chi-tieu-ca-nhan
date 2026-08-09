import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Account, Category, Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { buildCategoryTree } from '../../utils/categoryUtils';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: any) => Promise<void>;
  transactionToEdit?: Transaction | null;
  accounts: Account[];
  categories: Category[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transactionToEdit,
  accounts,
  categories,
}) => {
  const [type, setType] = useState<'thu' | 'chi'>('chi');
  const [amount, setAmount] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(String(transactionToEdit.amount));
      setAccountId(transactionToEdit.account_id);
      setCategoryId(transactionToEdit.category_id);
      setTransactionDate(transactionToEdit.transaction_date.split('T')[0]);
      setContent(transactionToEdit.content || '');
      setNote(transactionToEdit.note || '');
    } else {
      setType('chi');
      setAmount('');
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
      setTransactionDate(todayStr);
      setContent('');
      setNote('');
      
      // Auto select first category matching type 'chi'
      const defaultCat = categories.find((c) => c.type === 'chi');
      setCategoryId(defaultCat ? defaultCat.id : categories.length > 0 ? categories[0].id : '');
    }
    setError('');
  }, [transactionToEdit, isOpen, accounts, categories]);

  // When type changes, adjust category selection
  const handleTypeChange = (newType: 'thu' | 'chi') => {
    setType(newType);
    const matchingCat = categories.find((c) => c.type === newType);
    if (matchingCat) {
      setCategoryId(matchingCat.id);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Số tiền phải lớn hơn 0');
      return;
    }

    if (!accountId) {
      setError('Vui lòng chọn tài khoản');
      return;
    }

    if (!categoryId) {
      setError('Vui lòng chọn danh mục');
      return;
    }

    if (!transactionDate) {
      setError('Vui lòng chọn ngày giao dịch');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        type,
        amount: numAmount,
        account_id: accountId,
        category_id: categoryId,
        transaction_date: transactionDate,
        content: content.trim(),
        note: note.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu giao dịch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-medium rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            {error}
          </div>
        )}

        {/* Type Toggle: Thu / Chi */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => handleTypeChange('chi')}
            className={`py-2 rounded-lg font-semibold text-sm transition-all ${
              type === 'chi'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Chi tiêu (-)
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('thu')}
            className={`py-2 rounded-lg font-semibold text-sm transition-all ${
              type === 'thu'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Thu nhập (+)
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Số tiền (VNĐ) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                Gợi ý: {formatCurrency(Number(amount))}
              </p>
            )}
          </div>
        </div>

        {/* Category & Account Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Category Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Danh mục <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              {filteredCategories.length === 0 && <option value="">Chưa có danh mục</option>}
              {buildCategoryTree(categories, type).map((parent) => (
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

          {/* Account Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tài khoản <span className="text-rose-500">*</span>
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatCurrency(a.balance)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Ngày thực hiện <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Nội dung giao dịch
          </label>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ví dụ: Ăn trưa, Cà phê, Lương tháng..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ghi chú</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Ghi chú chi tiết thêm (không bắt buộc)..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
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
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm text-white shadow-md transition-all disabled:opacity-50 ${
              type === 'chi' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu giao dịch'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
