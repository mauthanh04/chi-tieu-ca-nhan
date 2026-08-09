import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

// GET /api/statistics/week
router.get('/week', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query; // Base date or today
    const baseDate = date ? new Date(String(date)) : new Date();

    // Find Monday of current week
    const currentDay = baseDate.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + distanceToMon);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const transactions = db.getTransactions().filter((t) => {
      if (t.user_id !== req.userId) return false;
      const d = new Date(t.transaction_date);
      return d >= monday && d <= sunday;
    });

    const totalThu = transactions.filter((t) => t.type === 'thu').reduce((sum, t) => sum + Number(t.amount), 0);
    const totalChi = transactions.filter((t) => t.type === 'chi').reduce((sum, t) => sum + Number(t.amount), 0);
    const savings = totalThu - totalChi;

    // Daily breakdown for Mon-Sun
    const dailyData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      const dayTxs = transactions.filter((t) => t.transaction_date.startsWith(dateStr));
      const thu = dayTxs.filter((t) => t.type === 'thu').reduce((sum, t) => sum + Number(t.amount), 0);
      const chi = dayTxs.filter((t) => t.type === 'chi').reduce((sum, t) => sum + Number(t.amount), 0);

      // Label: Mon -> "Thứ 2", etc.
      const dayIndex = d.getDay();
      const label = DAY_NAMES[dayIndex];

      dailyData.push({
        date: dateStr,
        dayLabel: label,
        thu,
        chi,
        tietKiem: thu - chi,
      });
    }

    return res.json({
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0],
      totalThu,
      totalChi,
      savings,
      dailyData,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi thống kê tuần' });
  }
});

// GET /api/statistics/month
router.get('/month', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query;
    const targetMonth = month ? Number(month) : new Date().getMonth() + 1;
    const targetYear = year ? Number(year) : new Date().getFullYear();

    const transactions = db.getTransactions().filter((t) => {
      if (t.user_id !== req.userId) return false;
      const d = new Date(t.transaction_date);
      return d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear;
    });

    const totalThu = transactions.filter((t) => t.type === 'thu').reduce((sum, t) => sum + Number(t.amount), 0);
    const totalChi = transactions.filter((t) => t.type === 'chi').reduce((sum, t) => sum + Number(t.amount), 0);
    const remaining = totalThu - totalChi;
    const savingsRate = totalThu > 0 ? Math.max(0, Math.round((remaining / totalThu) * 100)) : 0;

    // Daily breakdown for the entire month
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const dailyData = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayFormatted = String(day).padStart(2, '0');
      const monthFormatted = String(targetMonth).padStart(2, '0');
      const dateStr = `${targetYear}-${monthFormatted}-${dayFormatted}`;

      const dayTxs = transactions.filter((t) => t.transaction_date.startsWith(dateStr));
      const thu = dayTxs.filter((t) => t.type === 'thu').reduce((sum, t) => sum + Number(t.amount), 0);
      const chi = dayTxs.filter((t) => t.type === 'chi').reduce((sum, t) => sum + Number(t.amount), 0);

      dailyData.push({
        day,
        date: dateStr,
        thu,
        chi,
      });
    }

    // Category breakdown helper function
    const getCategoryBreakdown = (type: 'thu' | 'chi') => {
      const typeTxs = transactions.filter((t) => t.type === type);
      const total = type === 'thu' ? totalThu : totalChi;
      const categories = db.getCategories();
      const map = new Map<string, { amount: number; count: number }>();

      typeTxs.forEach((t) => {
        const prev = map.get(t.category_id) || { amount: 0, count: 0 };
        map.set(t.category_id, {
          amount: prev.amount + Number(t.amount),
          count: prev.count + 1,
        });
      });

      const list = Array.from(map.entries()).map(([catId, info]) => {
        const cat = categories.find((c) => c.id === catId);
        let name = 'Khác';
        let parentName = '';
        if (cat) {
          if (cat.parent_id) {
            const parent = categories.find((p) => p.id === cat.parent_id);
            if (parent) {
              name = `${parent.name} > ${cat.name}`;
              parentName = parent.name;
            } else {
              name = cat.name;
            }
          } else {
            name = cat.name;
          }
        }

        const percentage = total > 0 ? Math.round((info.amount / total) * 100) : 0;

        return {
          category_id: catId,
          name,
          parentName,
          catName: cat ? cat.name : 'Khác',
          amount: info.amount,
          count: info.count,
          percentage,
        };
      });

      list.sort((a, b) => b.amount - a.amount);
      return list;
    };

    const categoryChiData = getCategoryBreakdown('chi');
    const categoryThuData = getCategoryBreakdown('thu');

    return res.json({
      month: targetMonth,
      year: targetYear,
      totalThu,
      totalChi,
      remaining,
      savingsRate,
      dailyData,
      categoryData: categoryChiData,
      categoryChiData,
      categoryThuData,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi thống kê tháng' });
  }
});

// GET /api/statistics/year
router.get('/year', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { year } = req.query;
    const targetYear = year ? Number(year) : new Date().getFullYear();

    const transactions = db.getTransactions().filter((t) => {
      if (t.user_id !== req.userId) return false;
      const d = new Date(t.transaction_date);
      return d.getFullYear() === targetYear;
    });

    const monthlyBreakdown = [];
    let totalYearThu = 0;
    let totalYearChi = 0;

    for (let m = 1; m <= 12; m++) {
      const monthTxs = transactions.filter((t) => {
        const d = new Date(t.transaction_date);
        return d.getMonth() + 1 === m;
      });

      const thu = monthTxs.filter((t) => t.type === 'thu').reduce((sum, t) => sum + Number(t.amount), 0);
      const chi = monthTxs.filter((t) => t.type === 'chi').reduce((sum, t) => sum + Number(t.amount), 0);
      const tietKiem = thu - chi;

      totalYearThu += thu;
      totalYearChi += chi;

      monthlyBreakdown.push({
        month: m,
        monthLabel: `Tháng ${m}`,
        thu,
        chi,
        tietKiem,
      });
    }

    return res.json({
      year: targetYear,
      totalYearThu,
      totalYearChi,
      totalYearSavings: totalYearThu - totalYearChi,
      monthlyBreakdown,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi thống kê năm' });
  }
});

export default router;
