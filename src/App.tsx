import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { api } from './services/api';
import { Account, Category, Transaction } from './types';

// Layout & Common Components
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { MobileNavigation } from './components/common/MobileNavigation';
import { Toast, ToastMessage } from './components/common/Toast';
import { TransactionModal } from './components/transactions/TransactionModal';
import { ConfirmDialog } from './components/common/ConfirmDialog';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { AccountsPage } from './pages/AccountsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { SettingsPage } from './pages/SettingsPage';

function MainApp() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Navigation & View State
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Shared Data States
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);

  // Modal & Toast States
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);

  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [isDeletingTx, setIsDeletingTx] = useState<boolean>(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  const loadAllData = async () => {
    setIsDataLoading(true);
    try {
      const [accRes, catRes, txRes] = await Promise.all([
        api.getAccounts(),
        api.getCategories(),
        api.getTransactions(),
      ]);
      setAccounts(accRes.accounts);
      setCategories(catRes.categories);
      setTransactions(txRes.transactions);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    const newToast: ToastMessage = {
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type,
      text,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Transaction CRUD handlers
  const handleOpenAddTx = () => {
    setTxToEdit(null);
    setIsTxModalOpen(true);
  };

  const handleOpenEditTx = (tx: Transaction) => {
    setTxToEdit(tx);
    setIsTxModalOpen(true);
  };

  const handleSaveTransaction = async (txData: any) => {
    if (txToEdit) {
      await api.updateTransaction(txToEdit.id, txData);
      showToast('Đã sửa giao dịch thành công!');
    } else {
      await api.createTransaction(txData);
      showToast('Đã thêm giao dịch thành công!');
    }
    await loadAllData();
  };

  const handleConfirmDeleteTx = async () => {
    if (!deletingTxId) return;
    try {
      setIsDeletingTx(true);
      await api.deleteTransaction(deletingTxId);
      showToast('Đã xóa giao dịch thành công!');
      setDeletingTxId(null);
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa giao dịch', 'error');
    } finally {
      setIsDeletingTx(false);
    }
  };

  // Account CRUD handlers
  const handleCreateAccount = async (data: { name: string; type: any; balance: number }) => {
    await api.createAccount(data);
    showToast('Tạo tài khoản mới thành công!');
    await loadAllData();
  };

  const handleUpdateAccount = async (id: string, data: { name?: string; type?: any; balance?: number }) => {
    await api.updateAccount(id, data);
    showToast('Cập nhật tài khoản thành công!');
    await loadAllData();
  };

  const handleDeleteAccount = async (id: string, force = false) => {
    await api.deleteAccount(id, force);
    showToast('Xóa tài khoản thành công!');
    await loadAllData();
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Auth pages if not authenticated
  if (!isAuthenticated) {
    if (authView === 'register') {
      return (
        <RegisterPage
          onNavigateToLogin={(msg) => {
            if (msg) setLoginSuccessMsg(msg);
            setAuthView('login');
          }}
        />
      );
    }
    return (
      <LoginPage
        onNavigateToRegister={() => setAuthView('register')}
        successMessage={loginSuccessMsg}
      />
    );
  }

  // Get Page Title
  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Trang chính';
      case 'statistics':
        return 'Thống kê chi tiêu';
      case 'accounts':
        return 'Tài khoản & Tiền mặt';
      case 'budgets':
        return 'Ngân sách chi tiêu';
      case 'settings':
        return 'Cài đặt hệ thống';
      default:
        return 'Quản Lý Chi Tiêu';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row antialiased selection:bg-blue-500 selection:text-white">
      {/* Desktop Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenAddTransaction={handleOpenAddTx}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-8">
        <Header title={getTabTitle()} onOpenAddTransaction={handleOpenAddTx} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onOpenAddTransaction={handleOpenAddTx}
              onEditTransaction={handleOpenEditTx}
              onRequestDeleteTransaction={(id) => setDeletingTxId(id)}
              accounts={accounts}
              categories={categories}
              transactions={transactions}
              isLoading={isDataLoading}
              onRefreshData={loadAllData}
            />
          )}

          {currentTab === 'statistics' && <StatisticsPage />}

          {currentTab === 'accounts' && (
            <AccountsPage
              accounts={accounts}
              totalBalance={accounts.reduce((sum, a) => sum + Number(a.balance), 0)}
              onCreateAccount={handleCreateAccount}
              onUpdateAccount={handleUpdateAccount}
              onDeleteAccount={handleDeleteAccount}
            />
          )}

          {currentTab === 'budgets' && <BudgetsPage categories={categories} />}

          {currentTab === 'settings' && (
            <SettingsPage
              categories={categories}
              onRefreshCategories={loadAllData}
              onShowToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenAddTransaction={handleOpenAddTx}
      />

      {/* Global Add/Edit Transaction Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        transactionToEdit={txToEdit}
        accounts={accounts}
        categories={categories}
      />

      {/* Global Transaction Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTxId}
        onClose={() => setDeletingTxId(null)}
        onConfirm={handleConfirmDeleteTx}
        message="Bạn có chắc muốn xóa giao dịch này? Số dư tài khoản liên quan sẽ được tự động điều chỉnh lại chính xác."
        isLoading={isDeletingTx}
      />

      {/* Toast Feedback Messages */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
