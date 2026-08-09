import { Router, Response } from 'express';
import { db, Setting } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/settings
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const settingsList = db.getSettings();
  let setting = settingsList.find((s) => s.user_id === req.userId);

  if (!setting) {
    const now = new Date().toISOString();
    setting = {
      id: `stg_${req.userId}`,
      user_id: req.userId!,
      currency: 'VNĐ',
      theme: 'light',
      notifications_enabled: true,
      created_at: now,
      updated_at: now,
    };
    settingsList.push(setting);
    db.save();
  }

  return res.json({ setting });
});

// PUT /api/settings
router.put('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { currency, theme, notifications_enabled } = req.body;
    const settingsList = db.getSettings();
    let setting = settingsList.find((s) => s.user_id === req.userId);

    const now = new Date().toISOString();

    if (!setting) {
      setting = {
        id: `stg_${req.userId}`,
        user_id: req.userId!,
        currency: currency || 'VNĐ',
        theme: theme || 'light',
        notifications_enabled: notifications_enabled !== undefined ? Boolean(notifications_enabled) : true,
        created_at: now,
        updated_at: now,
      };
      settingsList.push(setting);
    } else {
      if (currency) setting.currency = currency;
      if (theme) setting.theme = theme;
      if (notifications_enabled !== undefined) setting.notifications_enabled = Boolean(notifications_enabled);
      setting.updated_at = now;
    }

    db.save();

    return res.json({
      message: 'Cập nhật cài đặt thành công',
      setting,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi cập nhật cài đặt' });
  }
});

// POST /api/settings/export
router.post('/export', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const user = db.getUsers().find((u) => u.id === userId);
    const accounts = db.getAccounts().filter((a) => a.user_id === userId);
    const categories = db.getCategories().filter((c) => c.user_id === userId);
    const transactions = db.getTransactions().filter((t) => t.user_id === userId);
    const budgets = db.getBudgets().filter((b) => b.user_id === userId);
    const settings = db.getSettings().find((s) => s.user_id === userId);

    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      user: { name: user?.name, email: user?.email },
      accounts,
      categories,
      transactions,
      budgets,
      settings,
    };

    return res.json({
      message: 'Xuất dữ liệu thành công',
      data: exportData,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi xuất dữ liệu' });
  }
});

// POST /api/settings/import
router.post('/import', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { data } = req.body;
    const userId = req.userId!;

    if (!data || !Array.isArray(data.accounts) || !Array.isArray(data.transactions)) {
      return res.status(400).json({ message: 'Dữ liệu khôi phục không hợp lệ' });
    }

    db.executeTransaction(() => {
      // Re-map IDs to prevent conflicts while binding to current user
      const accIdMap = new Map<string, string>();
      data.accounts.forEach((acc: any) => {
        const newAccId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        accIdMap.set(acc.id, newAccId);
        db.getAccounts().push({
          ...acc,
          id: newAccId,
          user_id: userId,
        });
      });

      const catIdMap = new Map<string, string>();
      if (Array.isArray(data.categories)) {
        data.categories.forEach((cat: any) => {
          const newCatId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          catIdMap.set(cat.id, newCatId);
          db.getCategories().push({
            ...cat,
            id: newCatId,
            user_id: userId,
          });
        });
      }

      if (Array.isArray(data.transactions)) {
        data.transactions.forEach((tx: any) => {
          db.getTransactions().push({
            ...tx,
            id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            user_id: userId,
            account_id: accIdMap.get(tx.account_id) || tx.account_id,
            category_id: catIdMap.get(tx.category_id) || tx.category_id,
          });
        });
      }
    });

    return res.json({ message: 'Nhập dữ liệu thành công!' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi nhập dữ liệu' });
  }
});

// DELETE /api/settings/account
router.delete('/account', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    db.executeTransaction(() => {
      // Delete user
      const users = db.getUsers();
      const uIndex = users.findIndex((u) => u.id === userId);
      if (uIndex !== -1) users.splice(uIndex, 1);

      // Remove all user associated data
      const remainingAccs = db.getAccounts().filter((a) => a.user_id !== userId);
      db.getAccounts().length = 0;
      db.getAccounts().push(...remainingAccs);

      const remainingCats = db.getCategories().filter((c) => c.user_id !== userId);
      db.getCategories().length = 0;
      db.getCategories().push(...remainingCats);

      const remainingTxs = db.getTransactions().filter((t) => t.user_id !== userId);
      db.getTransactions().length = 0;
      db.getTransactions().push(...remainingTxs);

      const remainingBudgets = db.getBudgets().filter((b) => b.user_id !== userId);
      db.getBudgets().length = 0;
      db.getBudgets().push(...remainingBudgets);

      const remainingSettings = db.getSettings().filter((s) => s.user_id !== userId);
      db.getSettings().length = 0;
      db.getSettings().push(...remainingSettings);
    });

    return res.json({ message: 'Xóa tài khoản và dữ liệu thành công' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi xóa tài khoản' });
  }
});

export default router;
