import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'nganhang' | 'tienmat' | 'videondientu' | 'khac';
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'thu' | 'chi';
  parent_id?: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  type: 'thu' | 'chi';
  amount: number;
  transaction_date: string; // ISO format YYYY-MM-DD or full timestamp
  note?: string;
  content?: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: number; // 1-12
  year: number;
  limit_amount: number;
  is_rollover?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  id: string;
  user_id: string;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSchema {
  users: User[];
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  settings: Setting[];
}

function getDbFilePath(): string {
  if (process.env.DB_FILE_PATH) {
    return process.env.DB_FILE_PATH;
  }
  if (process.env.VERCEL) {
    return '/tmp/database.json';
  }
  return path.join(process.cwd(), 'database.json');
}

let activeDbFilePath = getDbFilePath();

class JSONDatabase {
  private data: DatabaseSchema = {
    users: [],
    accounts: [],
    categories: [],
    transactions: [],
    budgets: [],
    settings: [],
  };

  constructor() {
    this.load();
    this.initDefaultSeed();
  }

  private load() {
    try {
      let fileToRead = activeDbFilePath;
      const cwdDb = path.join(process.cwd(), 'database.json');
      const tmpDb = '/tmp/database.json';

      if (fs.existsSync(cwdDb)) {
        fileToRead = cwdDb;
      } else if (fs.existsSync(tmpDb)) {
        fileToRead = tmpDb;
      }

      if (fs.existsSync(fileToRead)) {
        const raw = fs.readFileSync(fileToRead, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || [],
          accounts: parsed.accounts || [],
          categories: parsed.categories || [],
          transactions: parsed.transactions || [],
          budgets: parsed.budgets || [],
          settings: parsed.settings || [],
        };
      }
    } catch (err) {
      console.error('Failed to load database.json, starting fresh', err);
    }
  }

  public save() {
    try {
      fs.writeFileSync(activeDbFilePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.warn(`Failed to save to ${activeDbFilePath}, attempting fallback to /tmp/database.json`, err);
      try {
        activeDbFilePath = '/tmp/database.json';
        fs.writeFileSync(activeDbFilePath, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch (fallbackErr) {
        console.error('Failed to save database.json in fallback location', fallbackErr);
      }
    }
  }

  private initDefaultSeed() {
    // Check if demo user exists
    let demoUser = this.data.users.find((u) => u.email === 'demo@example.com');
    const now = new Date().toISOString();

    if (!demoUser) {
      const demoUserId = 'usr_demo_123456';
      const salt = bcrypt.genSaltSync(10);
      const password_hash = bcrypt.hashSync('Demo123456', salt);

      demoUser = {
        id: demoUserId,
        name: 'Demo User',
        email: 'demo@example.com',
        password_hash,
        created_at: now,
        updated_at: now,
      };

      this.data.users.push(demoUser);

      // Add default setting
      this.data.settings.push({
        id: 'stg_demo_1',
        user_id: demoUserId,
        currency: 'VNĐ',
        theme: 'light',
        notifications_enabled: true,
        created_at: now,
        updated_at: now,
      });

      // Add default accounts
      const accMB = {
        id: 'acc_mb_bank',
        user_id: demoUserId,
        name: 'MB Bank',
        type: 'nganhang' as const,
        balance: 10000000,
        created_at: now,
        updated_at: now,
      };
      const accCash = {
        id: 'acc_cash',
        user_id: demoUserId,
        name: 'Tiền mặt',
        type: 'tienmat' as const,
        balance: 2000000,
        created_at: now,
        updated_at: now,
      };
      this.data.accounts.push(accMB, accCash);

      // Add default categories
      const defaultCategories: Array<{ name: string; type: 'thu' | 'chi' }> = [
        { name: 'Ăn uống', type: 'chi' },
        { name: 'Mua sắm', type: 'chi' },
        { name: 'Đi lại', type: 'chi' },
        { name: 'Giải trí', type: 'chi' },
        { name: 'Hóa đơn', type: 'chi' },
        { name: 'Sức khỏe', type: 'chi' },
        { name: 'Học tập', type: 'chi' },
        { name: 'Nhà cửa', type: 'chi' },
        { name: 'Khác', type: 'chi' },
        { name: 'Lương', type: 'thu' },
        { name: 'Bán hàng', type: 'thu' },
        { name: 'Thưởng', type: 'thu' },
        { name: 'Khác', type: 'thu' },
      ];

      const categoryMap = new Map<string, string>();

      defaultCategories.forEach((cat, idx) => {
        const catId = `cat_demo_${idx + 1}_${cat.type}`;
        this.data.categories.push({
          id: catId,
          user_id: demoUserId,
          name: cat.name,
          type: cat.type,
          created_at: now,
        });
        categoryMap.set(`${cat.name}_${cat.type}`, catId);
      });

      // Helper date string for today and past days
      const today = new Date();
      const formatYMD = (d: Date) => d.toISOString().split('T')[0];

      const dToday = formatYMD(today);
      
      const dYesterday = new Date(today);
      dYesterday.setDate(dYesterday.getDate() - 1);
      const strYesterday = formatYMD(dYesterday);

      const d3DaysAgo = new Date(today);
      d3DaysAgo.setDate(d3DaysAgo.getDate() - 3);
      const str3DaysAgo = formatYMD(d3DaysAgo);

      const d5DaysAgo = new Date(today);
      d5DaysAgo.setDate(d5DaysAgo.getDate() - 5);
      const str5DaysAgo = formatYMD(d5DaysAgo);

      // Add demo transactions
      const catLuong = categoryMap.get('Lương_thu') || '';
      const catAnUong = categoryMap.get('Ăn uống_chi') || '';
      const catDiLai = categoryMap.get('Đi lại_chi') || '';
      const catBanHang = categoryMap.get('Bán hàng_thu') || '';
      const catMuaSam = categoryMap.get('Mua sắm_chi') || '';
      const catHoaDon = categoryMap.get('Hóa đơn_chi') || '';

      const demoTransactions: Transaction[] = [
        {
          id: 'tx_demo_1',
          user_id: demoUserId,
          account_id: accMB.id,
          category_id: catLuong,
          type: 'thu',
          amount: 15000000,
          transaction_date: str5DaysAgo,
          content: 'Nhận lương tháng này',
          note: 'Chuyển khoản công ty',
          created_at: now,
          updated_at: now,
        },
        {
          id: 'tx_demo_2',
          user_id: demoUserId,
          account_id: accMB.id,
          category_id: catBanHang,
          type: 'thu',
          amount: 500000,
          transaction_date: dToday,
          content: 'Bán hàng online',
          note: 'Khách chuyển khoản',
          created_at: now,
          updated_at: now,
        },
        {
          id: 'tx_demo_3',
          user_id: demoUserId,
          account_id: accCash.id,
          category_id: catAnUong,
          type: 'chi',
          amount: 45000,
          transaction_date: dToday,
          content: 'Ăn trưa',
          note: 'Cơm tấm',
          created_at: now,
          updated_at: now,
        },
        {
          id: 'tx_demo_4',
          user_id: demoUserId,
          account_id: accCash.id,
          category_id: catAnUong,
          type: 'chi',
          amount: 30000,
          transaction_date: dToday,
          content: 'Cà phê sáng',
          note: 'Highlands Coffee',
          created_at: now,
          updated_at: now,
        },
        {
          id: 'tx_demo_5',
          user_id: demoUserId,
          account_id: accCash.id,
          category_id: catDiLai,
          type: 'chi',
          amount: 25000,
          transaction_date: dToday,
          content: 'Xăng xe',
          note: 'Đổ xăng A95',
          created_at: now,
          updated_at: now,
        },
        {
          id: 'tx_demo_6',
          user_id: demoUserId,
          account_id: accMB.id,
          category_id: catMuaSam,
          type: 'chi',
          amount: 1200000,
          transaction_date: strYesterday,
          content: 'Mua quần áo',
          note: 'Áo sơ mi Uniqlo',
          created_at: now,
          updated_at: now,
        },
        {
          id: 'tx_demo_7',
          user_id: demoUserId,
          account_id: accMB.id,
          category_id: catHoaDon,
          type: 'chi',
          amount: 850000,
          transaction_date: str3DaysAgo,
          content: 'Thanh toán tiền điện nước',
          note: 'Hóa đơn tháng 8',
          created_at: now,
          updated_at: now,
        },
      ];

      this.data.transactions.push(...demoTransactions);

      // Add demo budget for current month
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      this.data.budgets.push(
        {
          id: 'bg_demo_1',
          user_id: demoUserId,
          category_id: catAnUong,
          month: currentMonth,
          year: currentYear,
          limit_amount: 3000000,
          created_at: now,
          updated_at: now,
        },
        {
          id: 'bg_demo_2',
          user_id: demoUserId,
          category_id: catMuaSam,
          month: currentMonth,
          year: currentYear,
          limit_amount: 2000000,
          created_at: now,
          updated_at: now,
        },
        {
          id: 'bg_demo_3',
          user_id: demoUserId,
          category_id: catDiLai,
          month: currentMonth,
          year: currentYear,
          limit_amount: 1000000,
          created_at: now,
          updated_at: now,
        },
        {
          id: 'bg_demo_4',
          user_id: demoUserId,
          category_id: catHoaDon,
          month: currentMonth,
          year: currentYear,
          limit_amount: 1500000,
          created_at: now,
          updated_at: now,
        }
      );

      this.save();
    }
  }

  // Getters & Collections
  public getUsers() {
    return this.data.users;
  }
  public getAccounts() {
    return this.data.accounts;
  }
  public getCategories() {
    return this.data.categories;
  }
  public getTransactions() {
    return this.data.transactions;
  }
  public getBudgets() {
    return this.data.budgets;
  }
  public getSettings() {
    return this.data.settings;
  }

  // Helper method to create default categories for new users
  public createDefaultCategoriesForUser(userId: string) {
    const now = new Date().toISOString();
    const defaults: Array<{ name: string; type: 'thu' | 'chi' }> = [
      { name: 'Ăn uống', type: 'chi' },
      { name: 'Mua sắm', type: 'chi' },
      { name: 'Đi lại', type: 'chi' },
      { name: 'Giải trí', type: 'chi' },
      { name: 'Hóa đơn', type: 'chi' },
      { name: 'Sức khỏe', type: 'chi' },
      { name: 'Học tập', type: 'chi' },
      { name: 'Nhà cửa', type: 'chi' },
      { name: 'Khác', type: 'chi' },
      { name: 'Lương', type: 'thu' },
      { name: 'Bán hàng', type: 'thu' },
      { name: 'Thưởng', type: 'thu' },
      { name: 'Khác', type: 'thu' },
    ];

    defaults.forEach((cat) => {
      this.data.categories.push({
        id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        user_id: userId,
        name: cat.name,
        type: cat.type,
        created_at: now,
      });
    });

    // Create default accounts
    this.data.accounts.push(
      {
        id: `acc_mb_${Date.now()}`,
        user_id: userId,
        name: 'MB Bank',
        type: 'nganhang',
        balance: 10000000,
        created_at: now,
        updated_at: now,
      },
      {
        id: `acc_cash_${Date.now()}`,
        user_id: userId,
        name: 'Tiền mặt',
        type: 'tienmat',
        balance: 2000000,
        created_at: now,
        updated_at: now,
      }
    );

    // Create default setting
    this.data.settings.push({
      id: `stg_${userId}`,
      user_id: userId,
      currency: 'VNĐ',
      theme: 'light',
      notifications_enabled: true,
      created_at: now,
      updated_at: now,
    });

    this.save();
  }

  // Atomic transaction helper to execute multiple mutations cleanly
  public executeTransaction<T>(fn: () => T): T {
    try {
      const result = fn();
      this.save();
      return result;
    } catch (err) {
      this.load(); // Rollback to stored state if anything threw an error
      throw err;
    }
  }
}

export const db = new JSONDatabase();
