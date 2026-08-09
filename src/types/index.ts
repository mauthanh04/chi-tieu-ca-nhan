export interface User {
  id: string;
  name: string;
  email: string;
}

export type AccountType = 'nganhang' | 'tienmat' | 'videondientu' | 'khac';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  created_at: string;
  updated_at: string;
}

export type CategoryType = 'thu' | 'chi';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  parent_id?: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  type: CategoryType;
  amount: number;
  transaction_date: string;
  content?: string;
  note?: string;
  created_at: string;
  updated_at: string;
  account_name?: string;
  category_name?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: number;
  year: number;
  limit_amount: number;
  is_rollover?: boolean;
  created_at: string;
  updated_at: string;
  category_name?: string;
  spent?: number;
  remaining?: number;
  percentage?: number;
  rollover_amount?: number;
  effective_limit?: number;
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

export interface WeekStats {
  startDate: string;
  endDate: string;
  totalThu: number;
  totalChi: number;
  savings: number;
  dailyData: Array<{
    date: string;
    dayLabel: string;
    thu: number;
    chi: number;
    tietKiem: number;
  }>;
}

export interface CategoryStat {
  category_id: string;
  name: string;
  catName?: string;
  parentName?: string;
  amount: number;
  count?: number;
  percentage: number;
}

export interface MonthStats {
  month: number;
  year: number;
  totalThu: number;
  totalChi: number;
  remaining: number;
  savingsRate: number;
  dailyData: Array<{
    day: number;
    date: string;
    thu: number;
    chi: number;
  }>;
  categoryData: CategoryStat[];
  categoryChiData?: CategoryStat[];
  categoryThuData?: CategoryStat[];
}

export interface YearStats {
  year: number;
  totalYearThu: number;
  totalYearChi: number;
  totalYearSavings: number;
  monthlyBreakdown: Array<{
    month: number;
    monthLabel: string;
    thu: number;
    chi: number;
    tietKiem: number;
  }>;
}
