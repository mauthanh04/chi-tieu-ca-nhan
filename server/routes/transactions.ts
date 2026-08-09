import { Router, Response } from 'express';
import { db, Transaction } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/transactions
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { date, month, year, type, account_id, category_id, search } = req.query;

    let userTxs = db.getTransactions().filter((t) => t.user_id === req.userId);

    // Filter by single date (YYYY-MM-DD)
    if (date) {
      userTxs = userTxs.filter((t) => t.transaction_date.startsWith(String(date)));
    }

    // Filter by month & year
    if (month) {
      const m = Number(month);
      userTxs = userTxs.filter((t) => {
        const d = new Date(t.transaction_date);
        return d.getMonth() + 1 === m;
      });
    }

    if (year) {
      const y = Number(year);
      userTxs = userTxs.filter((t) => {
        const d = new Date(t.transaction_date);
        return d.getFullYear() === y;
      });
    }

    // Filter by type
    if (type && (type === 'thu' || type === 'chi')) {
      userTxs = userTxs.filter((t) => t.type === type);
    }

    // Filter by account_id
    if (account_id) {
      userTxs = userTxs.filter((t) => t.account_id === String(account_id));
    }

    // Filter by category_id
    if (category_id) {
      userTxs = userTxs.filter((t) => t.category_id === String(category_id));
    }

    // Filter by search query
    if (search) {
      const q = String(search).toLowerCase().trim();
      userTxs = userTxs.filter(
        (t) =>
          (t.content && t.content.toLowerCase().includes(q)) ||
          (t.note && t.note.toLowerCase().includes(q))
      );
    }

    // Sort by transaction_date descending, then created_at descending
    userTxs.sort((a, b) => {
      const dateCompare = b.transaction_date.localeCompare(a.transaction_date);
      if (dateCompare !== 0) return dateCompare;
      return b.created_at.localeCompare(a.created_at);
    });

    // Populate category & account names for convenient rendering
    const accounts = db.getAccounts();
    const categories = db.getCategories();

    const populated = userTxs.map((t) => {
      const acc = accounts.find((a) => a.id === t.account_id);
      const cat = categories.find((c) => c.id === t.category_id);
      return {
        ...t,
        account_name: acc ? acc.name : 'Đã xóa',
        category_name: cat ? cat.name : 'Đã xóa',
      };
    });

    // Calculate totals for filtered set
    const totalThu = userTxs.filter((t) => t.type === 'thu').reduce((sum, t) => sum + Number(t.amount), 0);
    const totalChi = userTxs.filter((t) => t.type === 'chi').reduce((sum, t) => sum + Number(t.amount), 0);

    return res.json({
      transactions: populated,
      totalThu,
      totalChi,
      net: totalThu - totalChi,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi lấy danh sách giao dịch' });
  }
});

// GET /api/transactions/:id
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const tx = db.getTransactions().find((t) => t.id === id && t.user_id === req.userId);

  if (!tx) {
    return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
  }

  return res.json({ transaction: tx });
});

// POST /api/transactions
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { type, amount, account_id, category_id, transaction_date, content, note } = req.body;

    if (!type || !amount || !account_id || !category_id || !transaction_date) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin giao dịch bắt buộc' });
    }

    if (type !== 'thu' && type !== 'chi') {
      return res.status(400).json({ message: 'Loại giao dịch phải là "thu" hoặc "chi"' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Số tiền giao dịch phải lớn hơn 0' });
    }

    // Verify account belongs to user
    const accounts = db.getAccounts();
    const account = accounts.find((a) => a.id === account_id && a.user_id === req.userId);
    if (!account) {
      return res.status(400).json({ message: 'Tài khoản không hợp lệ hoặc không thuộc sở hữu của bạn' });
    }

    // Verify category belongs to user
    const categories = db.getCategories();
    const category = categories.find((c) => c.id === category_id && c.user_id === req.userId);
    if (!category) {
      return res.status(400).json({ message: 'Danh mục không hợp lệ' });
    }

    const now = new Date().toISOString();
    const newTx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: req.userId!,
      account_id,
      category_id,
      type,
      amount: numAmount,
      transaction_date,
      content: content ? content.trim() : category.name,
      note: note ? note.trim() : '',
      created_at: now,
      updated_at: now,
    };

    db.executeTransaction(() => {
      // Apply balance change
      if (type === 'thu') {
        account.balance += numAmount;
      } else {
        account.balance -= numAmount;
      }
      account.updated_at = now;

      db.getTransactions().push(newTx);
    });

    return res.status(201).json({
      message: 'Đã thêm giao dịch thành công',
      transaction: newTx,
      updatedBalance: account.balance,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi tạo giao dịch' });
  }
});

// PUT /api/transactions/:id
router.put('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type, amount, account_id, category_id, transaction_date, content, note } = req.body;

    const transactions = db.getTransactions();
    const tx = transactions.find((t) => t.id === id && t.user_id === req.userId);

    if (!tx) {
      return res.status(404).json({ message: 'Giao dịch không tồn tại' });
    }

    const newType = type || tx.type;
    if (newType !== 'thu' && newType !== 'chi') {
      return res.status(400).json({ message: 'Loại giao dịch không hợp lệ' });
    }

    const newAmount = amount !== undefined ? Number(amount) : tx.amount;
    if (isNaN(newAmount) || newAmount <= 0) {
      return res.status(400).json({ message: 'Số tiền giao dịch phải lớn hơn 0' });
    }

    const newAccountId = account_id || tx.account_id;
    const newCategoryId = category_id || tx.category_id;

    const accounts = db.getAccounts();
    const oldAccount = accounts.find((a) => a.id === tx.account_id && a.user_id === req.userId);
    const newAccount = accounts.find((a) => a.id === newAccountId && a.user_id === req.userId);

    if (!oldAccount || !newAccount) {
      return res.status(400).json({ message: 'Tài khoản không tồn tại' });
    }

    const now = new Date().toISOString();

    db.executeTransaction(() => {
      // 1. Revert old transaction balance impact
      if (tx.type === 'thu') {
        oldAccount.balance -= tx.amount;
      } else {
        oldAccount.balance += tx.amount;
      }

      // 2. Apply new transaction balance impact
      if (newType === 'thu') {
        newAccount.balance += newAmount;
      } else {
        newAccount.balance -= newAmount;
      }

      // 3. Update transaction record fields
      tx.type = newType;
      tx.amount = newAmount;
      tx.account_id = newAccountId;
      tx.category_id = newCategoryId;
      if (transaction_date) tx.transaction_date = transaction_date;
      if (content !== undefined) tx.content = content.trim();
      if (note !== undefined) tx.note = note.trim();
      tx.updated_at = now;

      oldAccount.updated_at = now;
      newAccount.updated_at = now;
    });

    return res.json({
      message: 'Đã cập nhật giao dịch thành công',
      transaction: tx,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi sửa giao dịch' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const transactions = db.getTransactions();
    const index = transactions.findIndex((t) => t.id === id && t.user_id === req.userId);

    if (index === -1) {
      return res.status(404).json({ message: 'Giao dịch không tồn tại' });
    }

    const tx = transactions[index];
    const accounts = db.getAccounts();
    const account = accounts.find((a) => a.id === tx.account_id && a.user_id === req.userId);

    db.executeTransaction(() => {
      // Revert balance impact if account still exists
      if (account) {
        if (tx.type === 'thu') {
          account.balance -= tx.amount;
        } else {
          account.balance += tx.amount;
        }
        account.updated_at = new Date().toISOString();
      }

      transactions.splice(index, 1);
    });

    return res.json({ message: 'Đã xóa giao dịch thành công' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi xóa giao dịch' });
  }
});

export default router;
