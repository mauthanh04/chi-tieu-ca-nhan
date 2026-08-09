import { Router, Response } from 'express';
import { db, Account } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get accounts
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const allAccounts = db.getAccounts();
  const userAccounts = allAccounts.filter((a) => a.user_id === req.userId);
  const totalBalance = userAccounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return res.json({
    accounts: userAccounts,
    totalBalance,
  });
});

// Create account
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { name, type, balance } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Vui lòng nhập tên tài khoản và chọn loại tài khoản' });
    }

    const validTypes = ['nganhang', 'tienmat', 'videondientu', 'khac'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Loại tài khoản không hợp lệ' });
    }

    const initialBalance = Number(balance) || 0;
    const now = new Date().toISOString();

    const newAccount: Account = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: req.userId!,
      name: name.trim(),
      type,
      balance: initialBalance,
      created_at: now,
      updated_at: now,
    };

    db.executeTransaction(() => {
      db.getAccounts().push(newAccount);
    });

    return res.status(201).json({
      message: 'Tạo tài khoản thành công',
      account: newAccount,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi tạo tài khoản' });
  }
});

// Update account
router.put('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, balance } = req.body;

    const accounts = db.getAccounts();
    const account = accounts.find((a) => a.id === id && a.user_id === req.userId);

    if (!account) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại hoặc không có quyền truy cập' });
    }

    if (name) account.name = name.trim();
    if (type) {
      const validTypes = ['nganhang', 'tienmat', 'videondientu', 'khac'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: 'Loại tài khoản không hợp lệ' });
      }
      account.type = type;
    }
    if (balance !== undefined) {
      account.balance = Number(balance) || 0;
    }

    account.updated_at = new Date().toISOString();
    db.save();

    return res.json({
      message: 'Cập nhật tài khoản thành công',
      account,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi cập nhật tài khoản' });
  }
});

// Delete account
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const accounts = db.getAccounts();
    const accountIndex = accounts.findIndex((a) => a.id === id && a.user_id === req.userId);

    if (accountIndex === -1) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại' });
    }

    // Check if account has transactions
    const transactions = db.getTransactions();
    const linkedTxCount = transactions.filter((t) => t.account_id === id && t.user_id === req.userId).length;

    if (linkedTxCount > 0 && req.query.force !== 'true') {
      return res.status(400).json({
        message: `Tài khoản này đang chứa ${linkedTxCount} giao dịch. Nếu xóa, các giao dịch liên quan sẽ bị ảnh hưởng. Bạn có chắc chắn muốn xóa không?`,
        hasTransactions: true,
        transactionCount: linkedTxCount,
      });
    }

    db.executeTransaction(() => {
      // Remove linked transactions if force is true
      if (linkedTxCount > 0) {
        const remainingTx = transactions.filter((t) => !(t.account_id === id && t.user_id === req.userId));
        db.getTransactions().length = 0;
        db.getTransactions().push(...remainingTx);
      }
      accounts.splice(accountIndex, 1);
    });

    return res.json({ message: 'Xóa tài khoản thành công' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi xóa tài khoản' });
  }
});

export default router;
