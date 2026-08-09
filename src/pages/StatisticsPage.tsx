import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { WeekStats, MonthStats, YearStats } from '../types';
import { formatCurrency, getAvailableYears } from '../utils/formatters';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';

const COLOR_PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#64748B', '#14B8A6', '#F97316',
];

export const StatisticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'week' | 'month' | 'year'>('month');
  const [categoryTypeTab, setCategoryTypeTab] = useState<'chi' | 'thu'>('chi');

  // Month state
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Data states
  const [weekData, setWeekData] = useState<WeekStats | null>(null);
  const [monthData, setMonthData] = useState<MonthStats | null>(null);
  const [yearData, setYearData] = useState<YearStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchStats();
  }, [activeTab, selectedMonth, selectedYear]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'week') {
        const res = await api.getWeekStats();
        setWeekData(res);
      } else if (activeTab === 'month') {
        const res = await api.getMonthStats(selectedMonth, selectedYear);
        setMonthData(res);
      } else {
        const res = await api.getYearStats(selectedYear);
        setYearData(res);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('week')}
            className={`py-2 px-3 sm:px-6 rounded-lg font-bold text-xs sm:text-sm transition-all text-center whitespace-nowrap ${
              activeTab === 'week'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            TUẦN
          </button>
          <button
            onClick={() => setActiveTab('month')}
            className={`py-2 px-3 sm:px-6 rounded-lg font-bold text-xs sm:text-sm transition-all text-center whitespace-nowrap ${
              activeTab === 'month'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            THÁNG
          </button>
          <button
            onClick={() => setActiveTab('year')}
            className={`py-2 px-3 sm:px-6 rounded-lg font-bold text-xs sm:text-sm transition-all text-center whitespace-nowrap ${
              activeTab === 'year'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            NĂM
          </button>
        </div>

        {/* Date Selector Controls for Month / Year */}
        {activeTab === 'month' && (
          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              {getAvailableYears(selectedYear).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'year' && (
          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              {getAvailableYears(selectedYear).map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* TAB 1: TUẦN */}
          {activeTab === 'week' && weekData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Tổng thu tuần
                  </p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(weekData.totalThu)}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4 text-rose-500" /> Tổng chi tuần
                  </p>
                  <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                    -{formatCurrency(weekData.totalChi)}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                    <PiggyBank className="w-4 h-4 text-blue-500" /> Tiết kiệm tuần
                  </p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(weekData.savings)}
                  </p>
                </div>
              </div>

              {/* Weekly Bar Chart */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Biểu đồ thu chi từng ngày trong tuần
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekData.dailyData}>
                      <XAxis dataKey="dayLabel" stroke="#94a3b8" fontSize={12} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickFormatter={(val) => `${val / 1000}K`}
                      />
                      <Tooltip
                        formatter={(val: any) => formatCurrency(Number(val))}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                      />
                      <Bar dataKey="thu" name="Thu nhập" fill="#10B981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="chi" name="Chi tiêu" fill="#EF4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: THÁNG */}
          {activeTab === 'month' && monthData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-500 mb-1">Thu nhập tháng</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(monthData.totalThu)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-500 mb-1">Chi tiêu tháng</p>
                  <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                    -{formatCurrency(monthData.totalChi)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-500 mb-1">Số tiền còn lại</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(monthData.remaining)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-500 mb-1">Tỷ lệ tiết kiệm</p>
                  <p className="text-lg font-bold text-amber-500">{monthData.savingsRate}%</p>
                </div>
              </div>

              {/* Bar Chart: Daily Trend */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Biểu đồ thu / chi theo ngày (Tháng {selectedMonth}/{selectedYear})
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthData.dailyData}>
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickFormatter={(val) => `${val / 1000}K`}
                      />
                      <Tooltip
                        formatter={(val: any) => formatCurrency(Number(val))}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                      />
                      <Bar dataKey="thu" name="Thu nhập" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="chi" name="Chi tiêu" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Detailed Breakdown & Chart Side-by-Side */}
              {(() => {
                const activeCategories =
                  categoryTypeTab === 'chi'
                    ? monthData.categoryChiData || monthData.categoryData || []
                    : monthData.categoryThuData || [];
                const activeTotal = categoryTypeTab === 'chi' ? monthData.totalChi : monthData.totalThu;

                return (
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6">
                    {/* Header with Type Selector */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          Thống kê chi tiết theo danh mục
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Xem chi tiết danh sách từng danh mục bên trái và biểu đồ phân bổ tỷ lệ bên phải
                        </p>
                      </div>

                      {/* Toggle Chi tiêu / Thu nhập */}
                      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0 self-start sm:self-auto">
                        <button
                          onClick={() => setCategoryTypeTab('chi')}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            categoryTypeTab === 'chi'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          Chi tiêu (-)
                        </button>
                        <button
                          onClick={() => setCategoryTypeTab('thu')}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            categoryTypeTab === 'thu'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          Thu nhập (+)
                        </button>
                      </div>
                    </div>

                    {/* Content Grid: 1 side Details, 1 side Chart */}
                    {activeCategories.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        Chưa có dữ liệu danh mục {categoryTypeTab === 'chi' ? 'chi tiêu' : 'thu nhập'} trong tháng này
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        {/* LEFT SIDE: Category Detail List (6 cols) */}
                        <div className="lg:col-span-6 space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800">
                            <span>Danh mục ({activeCategories.length})</span>
                            <span>Số tiền & Tỷ lệ</span>
                          </div>

                          {activeCategories.map((item, idx) => {
                            const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
                            return (
                              <div
                                key={item.category_id || idx}
                                className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                                      style={{ backgroundColor: color }}
                                    />
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                      {item.name}
                                    </span>
                                    {item.count && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                                        {item.count} GD
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-right shrink-0 flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                      {formatCurrency(item.amount)}
                                    </span>
                                    <span
                                      className="text-[11px] font-bold px-2 py-0.5 rounded-lg text-white shrink-0"
                                      style={{ backgroundColor: color }}
                                    >
                                      {item.percentage}%
                                    </span>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-slate-200/60 dark:bg-slate-700/60 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${Math.max(item.percentage, 2)}%`,
                                      backgroundColor: color,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* RIGHT SIDE: Donut / Pie Chart (6 cols) */}
                        <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/60 min-h-[350px]">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                            Biểu đồ phân bổ {categoryTypeTab === 'chi' ? 'Chi tiêu' : 'Thu nhập'}
                          </p>

                          <div className="h-64 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={activeCategories}
                                  dataKey="amount"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={95}
                                  innerRadius={60}
                                  paddingAngle={3}
                                >
                                  {activeCategories.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLOR_PALETTE[index % COLOR_PALETTE.length]}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(val: any) => [formatCurrency(Number(val)), 'Số tiền']}
                                  contentStyle={{
                                    backgroundColor: '#0f172a',
                                    borderColor: '#334155',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontSize: '12px',
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>

                            {/* Center Donut Overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Tổng cộng
                              </span>
                              <span
                                className={`text-sm font-extrabold ${
                                  categoryTypeTab === 'chi'
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                {formatCurrency(activeTotal)}
                              </span>
                            </div>
                          </div>

                          {/* Legend Below Chart */}
                          <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-md">
                            {activeCategories.slice(0, 6).map((cat, idx) => (
                              <div
                                key={cat.category_id || idx}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: COLOR_PALETTE[idx % COLOR_PALETTE.length] }}
                                />
                                <span className="truncate max-w-[100px]">{cat.name}</span>
                                <span className="text-slate-400 text-[10px]">({cat.percentage}%)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: NĂM */}
          {activeTab === 'year' && yearData && (
            <div className="space-y-6">
              {/* Year Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-500 mb-1">Tổng thu năm {selectedYear}</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(yearData.totalYearThu)}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-500 mb-1">Tổng chi năm {selectedYear}</p>
                  <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                    -{formatCurrency(yearData.totalYearChi)}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-500 mb-1">Tích lũy năm</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(yearData.totalYearSavings)}
                  </p>
                </div>
              </div>

              {/* 12 Months Chart */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Biểu đồ thu nhập và chi tiêu 12 tháng năm {selectedYear}
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearData.monthlyBreakdown}>
                      <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={11} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickFormatter={(val) => `${val / 1000000}M`}
                      />
                      <Tooltip
                        formatter={(val: any) => formatCurrency(Number(val))}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                      />
                      <Bar dataKey="thu" name="Thu nhập" fill="#10B981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="chi" name="Chi tiêu" fill="#EF4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
