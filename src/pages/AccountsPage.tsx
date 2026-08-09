import React, { useState } from 'react';
import { Account, AccountType } from '../types';
import { formatCurrency, getAccountTypeLabel } from '../utils/formatters';
import { AccountModal } from '../components/accounts/AccountModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { CreditCard, Wallet, Plus, Edit2, Trash2, Landmark, Smartphone } from 'lucide-react';

interface AccountsPageProps {
  accounts: Account[];
  totalBalance: number;
  onCreateAccount: (data: { name: string; type: AccountType; balance: number }) => Promise<void>;
  onUpdateAccount: (id: string, data: { name?: string; type?: AccountType; balance?: number }) => Promise<void>;
  onDeleteAccount: (id: string, force?: boolean) => Promise<void>;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  accounts,
  totalBalance,
  onCreateAccount,
  onUpdateAccount,
  onDeleteAccount,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Confirm delete states
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [deleteWarningMsg, setDeleteWarningMsg] = useState<string>('');
  const [isForceDelete, setIsForceDelete] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setIsModalOpen(true);
  };

  const handleSaveAccount = async (data: { name: string; type: AccountType; balance: number }) => {
    if (editingAccount) {
      await onUpdateAccount(editingAccount.id, data);
    } else {
      await onCreateAccount(data);
    }
  };

  const handleRequestDelete = (id: string) => {
    setDeletingAccountId(id);
    setDeleteWarningMsg('Bạn có chắc chắn muốn xóa tài khoản này?');
    setIsForceDelete(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAccountId) return;
    try {
      setIsDeleting(true);
      await onDeleteAccount(deletingAccountId, isForceDelete);
      setDeletingAccountId(null);
    } catch (err: any) {
      if (err.hasTransactions) {
        setDeleteWarningMsg(err.message);
        setIsForceDelete(true);
      } else {
        alert(err.message || 'Lỗi khi xóa tài khoản');
        setDeletingAccountId(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'nganhang':
        return <Landmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'tienmat':
        return <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'videondientu':
        return <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Total Balance Card & Add Button */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider mb-1">
            Tổng tài sản
          </p>
          <p className="text-3xl font-black">{formatCurrency(totalBalance)}</p>
          <p className="text-xs text-blue-200 mt-1">{accounts.length} tài khoản đang quản lý</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="py-3 px-5 rounded-2xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm tài khoản</span>
        </button>
      </div>

      {/* Account Cards List */}
      {accounts.length === 0 ? (
        <EmptyState
          title="Chưa có tài khoản"
          description="Hãy tạo tài khoản ngân hàng hoặc tiền mặt đầu tiên để quản lý dòng tiền."
          actionLabel="Thêm tài khoản ngay"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {getAccountIcon(acc.type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                      {acc.name}
                    </h4>
                    <span className="text-[11px] font-medium text-slate-400">
                      {getAccountTypeLabel(acc.type)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(acc)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRequestDelete(acc.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400 mb-0.5">Số dư hiện tại</p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {formatCurrency(acc.balance)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Account Modal */}
      <AccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAccount}
        accountToEdit={editingAccount}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingAccountId}
        onClose={() => setDeletingAccountId(null)}
        onConfirm={handleConfirmDelete}
        message={deleteWarningMsg}
        confirmLabel={isForceDelete ? 'Đồng ý xóa hết' : 'Xóa tài khoản'}
        isLoading={isDeleting}
      />
    </div>
  );
};
