import { Router, Response } from 'express';
import { db, Budget } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/budgets?month=8&year=2026&rollover=true
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { month, year, rollover } = req.query;
    const allUserBudgets = db.getBudgets().filter((b) => b.user_id === req.userId);

    const targetMonth = month ? Number(month) : new Date().getMonth() + 1;
    const targetYear = year ? Number(year) : new Date().getFullYear();

    const userBudgets = allUserBudgets.filter((b) => b.month === targetMonth && b.year === targetYear);

    const categories = db.getCategories();
    const transactions = db.getTransactions();

    // Determine previous month and year
    const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
    const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;

    const populatedBudgets = userBudgets.map((b) => {
      const category = categories.find((c) => c.id === b.category_id);

      // Calculate total expense in this category for target month and year
      const spent = transactions
        .filter((t) => {
          if (t.user_id !== req.userId || t.category_id !== b.category_id || t.type !== 'chi') return false;
          const d = new Date(t.transaction_date);
          return d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Determine if rollover applies
      const applyRollover = rollover !== undefined ? rollover === 'true' : (b.is_rollover ?? false);

      let rollover_amount = 0;
      if (applyRollover) {
        // Find previous month budget for this category
        const prevBudget = allUserBudgets.find(
          (pb) => pb.category_id === b.category_id && pb.month === prevMonth && pb.year === prevYear
        );

        if (prevBudget) {
          const prevSpent = transactions
            .filter((t) => {
              if (t.user_id !== req.userId || t.category_id !== b.category_id || t.type !== 'chi') return false;
              const d = new Date(t.transaction_date);
              return d.getMonth() + 1 === prevMonth && d.getFullYear() === prevYear;
            })
            .reduce((sum, t) => sum + Number(t.amount), 0);

          const prevRemaining = prevBudget.limit_amount - prevSpent;
          if (prevRemaining > 0) {
            rollover_amount = prevRemaining;
          }
        }
      }

      const effective_limit = b.limit_amount + rollover_amount;
      const percentage = effective_limit > 0 ? Math.round((spent / effective_limit) * 100) : 0;
      const remaining = effective_limit - spent;

      return {
        ...b,
        is_rollover: applyRollover,
        category_name: category ? category.name : 'Danh mục đã xóa',
        spent,
        rollover_amount,
        effective_limit,
        remaining,
        percentage,
      };
    });

    return res.json({
      budgets: populatedBudgets,
      month: targetMonth,
      year: targetYear,
      prevMonth,
      prevYear,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi lấy danh sách ngân sách' });
  }
});

// POST /api/budgets
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { category_id, month, year, limit_amount, is_rollover, apply_all_months } = req.body;

    if (!category_id || !month || !year || limit_amount === undefined) {
      return res.status(400).json({ message: 'Vui lòng chọn danh mục, tháng, năm và nhập hạn mức' });
    }

    const numMonth = Number(month);
    const numYear = Number(year);
    const numLimit = Number(limit_amount);

    if (numMonth < 1 || numMonth > 12) {
      return res.status(400).json({ message: 'Tháng không hợp lệ (1-12)' });
    }

    if (numLimit <= 0) {
      return res.status(400).json({ message: 'Hạn mức ngân sách phải lớn hơn 0' });
    }

    const budgets = db.getBudgets();
    const now = new Date().toISOString();

    if (apply_all_months) {
      db.executeTransaction(() => {
        for (let m = 1; m <= 12; m++) {
          const existing = budgets.find(
            (b) =>
              b.user_id === req.userId &&
              b.category_id === category_id &&
              b.month === m &&
              b.year === numYear
          );

          if (existing) {
            existing.limit_amount = numLimit;
            if (is_rollover !== undefined) existing.is_rollover = Boolean(is_rollover);
            existing.updated_at = now;
          } else {
            budgets.push({
              id: `bg_${Date.now()}_${m}_${Math.random().toString(36).substring(2, 7)}`,
              user_id: req.userId!,
              category_id,
              month: m,
              year: numYear,
              limit_amount: numLimit,
              is_rollover: Boolean(is_rollover),
              created_at: now,
              updated_at: now,
            });
          }
        }
      });

      const targetBudget = budgets.find(
        (b) => b.user_id === req.userId && b.category_id === category_id && b.month === numMonth && b.year === numYear
      );

      return res.status(201).json({
        message: 'Đã áp dụng hạn mức ngân sách cho cả 12 tháng',
        budget: targetBudget,
      });
    }

    // Single month save
    const existing = budgets.find(
      (b) =>
        b.user_id === req.userId &&
        b.category_id === category_id &&
        b.month === numMonth &&
        b.year === numYear
    );

    if (existing) {
      return res.status(400).json({ message: 'Đã có ngân sách cho danh mục này trong tháng được chọn' });
    }

    const newBudget: Budget = {
      id: `bg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: req.userId!,
      category_id,
      month: numMonth,
      year: numYear,
      limit_amount: numLimit,
      is_rollover: Boolean(is_rollover),
      created_at: now,
      updated_at: now,
    };

    db.executeTransaction(() => {
      budgets.push(newBudget);
    });

    return res.status(201).json({
      message: 'Thiết lập ngân sách thành công',
      budget: newBudget,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi tạo ngân sách' });
  }
});

// PUT /api/budgets/:id
router.put('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { limit_amount, is_rollover, apply_all_months } = req.body;

    const budgets = db.getBudgets();
    const budget = budgets.find((b) => b.id === id && b.user_id === req.userId);

    if (!budget) {
      return res.status(404).json({ message: 'Ngân sách không tồn tại' });
    }

    const numLimit = Number(limit_amount);
    if (isNaN(numLimit) || numLimit <= 0) {
      return res.status(400).json({ message: 'Hạn mức ngân sách phải lớn hơn 0' });
    }

    const now = new Date().toISOString();

    if (apply_all_months) {
      db.executeTransaction(() => {
        for (let m = 1; m <= 12; m++) {
          const existing = budgets.find(
            (b) =>
              b.user_id === req.userId &&
              b.category_id === budget.category_id &&
              b.month === m &&
              b.year === budget.year
          );

          if (existing) {
            existing.limit_amount = numLimit;
            if (is_rollover !== undefined) existing.is_rollover = Boolean(is_rollover);
            existing.updated_at = now;
          } else {
            budgets.push({
              id: `bg_${Date.now()}_${m}_${Math.random().toString(36).substring(2, 7)}`,
              user_id: req.userId!,
              category_id: budget.category_id,
              month: m,
              year: budget.year,
              limit_amount: numLimit,
              is_rollover: is_rollover !== undefined ? Boolean(is_rollover) : budget.is_rollover,
              created_at: now,
              updated_at: now,
            });
          }
        }
      });

      return res.json({
        message: 'Đã cập nhật hạn mức cho tất cả 12 tháng',
        budget,
      });
    }

    budget.limit_amount = numLimit;
    if (is_rollover !== undefined) {
      budget.is_rollover = Boolean(is_rollover);
    }
    budget.updated_at = now;
    db.save();

    return res.json({
      message: 'Cập nhật ngân sách thành công',
      budget,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi sửa ngân sách' });
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const budgets = db.getBudgets();
    const index = budgets.findIndex((b) => b.id === id && b.user_id === req.userId);

    if (index === -1) {
      return res.status(404).json({ message: 'Ngân sách không tồn tại' });
    }

    db.executeTransaction(() => {
      budgets.splice(index, 1);
    });

    return res.json({ message: 'Đã xóa ngân sách' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi xóa ngân sách' });
  }
});

export default router;
