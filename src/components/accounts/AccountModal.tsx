import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Account, AccountType } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; type: AccountType; balance: number }) => Promise<void>;
  accountToEdit?: Account | null;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accountToEdit,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('nganhang');
  const [balance, setBalance] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name);
      setType(accountToEdit.type);
      setBalance(String(accountToEdit.balance));
    } else {
      setName('');
      setType('nganhang');
      setBalance('0');
    }
    setError('');
  }, [accountToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Vui lòng nhập tên tài khoản');
      return;
    }

    const numBalance = Number(balance);
    if (isNaN(numBalance)) {
      setError('Số dư không hợp lệ');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        name: name.trim(),
        type,
        balance: numBalance,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu tài khoản');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={accountToEdit ? 'Sửa thông tin tài khoản' : 'Thêm tài khoản mới'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-medium rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Tên tài khoản <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: MB Bank, Tiền mặt, MoMo..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Loại tài khoản <span className="text-rose-500">*</span>
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            required
          >
            <option value="nganhang">Ngân hàng</option>
            <option value="tienmat">Tiền mặt</option>
            <option value="videondientu">Ví điện tử</option>
            <option value="khac">Khác</option>
          </select>
        </div>

        {/* Initial Balance */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Số dư ban đầu (VNĐ)
          </label>
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {balance && !isNaN(Number(balance)) && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formatCurrency(Number(balance))}
            </p>
          )}
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
            {isSubmitting ? 'Đang lưu...' : 'Lưu tài khoản'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
