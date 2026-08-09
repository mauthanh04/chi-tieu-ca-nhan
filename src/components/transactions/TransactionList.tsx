import React, { useState } from 'react';
import { Transaction, Account, Category } from '../../types';
import { TransactionItem } from './TransactionItem';
import { EmptyState } from '../common/EmptyState';
import { formatCurrency } from '../../utils/formatters';
import { buildCategoryTree } from '../../utils/categoryUtils';
import { Search, Filter, X } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  title?: string;
  showFilters?: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  accounts,
  categories,
  onEditTransaction,
  onDeleteTransaction,
  title = 'Danh sách giao dịch',
  showFilters = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTransactions = transactions.filter((tx) => {
    // Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchContent = tx.content && tx.content.toLowerCase().includes(q);
      const matchNote = tx.note && tx.note.toLowerCase().includes(q);
      const matchCat = tx.category_name && tx.category_name.toLowerCase().includes(q);
      if (!matchContent && !matchNote && !matchCat) return false;
    }

    // Type filter
    if (selectedType !== 'all' && tx.type !== selectedType) return false;

    // Account filter
    if (selectedAccount !== 'all' && tx.account_id !== selectedAccount) return false;

    // Category filter
    if (selectedCategory !== 'all' && tx.category_id !== selectedCategory) return false;

    return true;
  });

  const totalThu = filteredTransactions
    .filter((t) => t.type === 'thu')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalChi = filteredTransactions
    .filter((t) => t.type === 'chi')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const hasActiveFilters =
    searchTerm !== '' || selectedType !== 'all' || selectedAccount !== 'all' || selectedCategory !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedAccount('all');
    setSelectedCategory('all');
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>

        {/* Filter Summary Badge */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200/60 dark:border-emerald-800">
            Thu: +{formatCurrency(totalThu)}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-semibold border border-rose-200/60 dark:border-rose-800">
            Chi: -{formatCurrency(totalChi)}
          </span>
        </div>
      </div>

      {showFilters && (
        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm giao dịch (nội dung, ghi chú, danh mục)..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* Type */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">Tất cả loại giao dịch</option>
              <option value="thu">Khoản thu (+)</option>
              <option value="chi">Khoản chi (-)</option>
            </select>

            {/* Account */}
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">Tất cả tài khoản</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">Tất cả danh mục</option>
              {buildCategoryTree(categories).map((parent) => (
                <React.Fragment key={parent.id}>
                  <option value={parent.id} className="font-bold">
                    {parent.name} ({parent.type === 'thu' ? '+' : '-'})
                  </option>
                  {parent.children.map((child) => (
                    <option key={child.id} value={child.id}>
                      &nbsp;&nbsp;&nbsp;&nbsp;└ {child.name} ({child.type === 'thu' ? '+' : '-'})
                    </option>
                  ))}
                </React.Fragment>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-500">
                Hiển thị {filteredTransactions.length} / {transactions.length} giao dịch
              </span>
              <button
                onClick={resetFilters}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      )}

      {/* Transaction Items */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          title="Không tìm thấy giao dịch"
          description={
            hasActiveFilters
              ? 'Không có giao dịch nào khớp với bộ lọc đã chọn.'
              : 'Bạn chưa tạo giao dịch nào trong khoảng thời gian này.'
          }
          actionLabel={hasActiveFilters ? 'Xóa bộ lọc' : undefined}
          onAction={hasActiveFilters ? resetFilters : undefined}
        />
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              onEdit={onEditTransaction}
              onDelete={onDeleteTransaction}
            />
          ))}
        </div>
      )}
    </div>
  );
};
