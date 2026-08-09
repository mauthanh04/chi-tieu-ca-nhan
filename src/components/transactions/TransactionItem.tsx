import React from 'react';
import { Transaction } from '../../types';
import { formatCurrency, formatDateVN } from '../../utils/formatters';
import { ArrowUpRight, ArrowDownRight, Edit2, Trash2 } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onEdit,
  onDelete,
}) => {
  const isThu = transaction.type === 'thu';

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:shadow-sm transition-all group">
      {/* Icon & Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isThu
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
          }`}
        >
          {isThu ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
              {transaction.content || transaction.category_name}
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
              {transaction.category_name}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            <span>{transaction.account_name}</span>
            <span>•</span>
            <span>{formatDateVN(transaction.transaction_date)}</span>
            {transaction.note && (
              <>
                <span>•</span>
                <span className="truncate max-w-[120px] sm:max-w-[200px] text-slate-500 italic">
                  {transaction.note}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Amount & Actions */}
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <span
          className={`font-bold text-sm sm:text-base ${
            isThu ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {isThu ? '+' : '-'}{formatCurrency(transaction.amount)}
        </span>

        {/* Edit / Delete Action Buttons */}
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(transaction)}
            title="Sửa giao dịch"
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            title="Xóa giao dịch"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
