import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { Category } from '../types';
import { buildCategoryTree, CategoryTreeNode } from '../utils/categoryUtils';
import {
  User as UserIcon,
  Lock,
  Sun,
  Moon,
  Bell,
  Download,
  Upload,
  LogOut,
  Trash2,
  CheckCircle2,
  FolderTree,
  Plus,
  Edit2,
  CornerDownRight,
  FolderPlus,
  Tag,
} from 'lucide-react';

interface SettingsPageProps {
  categories?: Category[];
  onRefreshCategories?: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  categories = [],
  onRefreshCategories,
  onShowToast,
}) => {
  const { user, logout } = useAuth();
  const { themeMode, setThemeMode } = useTheme();

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [currency, setCurrency] = useState('VNĐ');

  // Delete account modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Category management state
  const [catTypeTab, setCatTypeTab] = useState<'chi' | 'thu'>('chi');
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catToEdit, setCatToEdit] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'thu' | 'chi'>('chi');
  const [catIsSub, setCatIsSub] = useState(false);
  const [catParentId, setCatParentId] = useState<string>('');
  const [catError, setCatError] = useState('');
  const [isSavingCat, setIsSavingCat] = useState(false);

  // Delete category state
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [isDeletingCat, setIsDeletingCat] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      if (res.setting) {
        if (res.setting.theme) {
          const mode = res.setting.theme === 'dark' ? 'dark' : 'light';
          setThemeMode(mode);
        }
        setNotificationsEnabled(res.setting.notifications_enabled);
        setCurrency(res.setting.currency || 'VNĐ');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleThemeChange = async (mode: 'light' | 'dark') => {
    setThemeMode(mode);
    try {
      await api.updateSettings({ theme: mode });
      onShowToast(`Đã đổi giao diện sang ${mode === 'light' ? 'Sáng (Light)' : 'Tối (Dark)'}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCurrencyChange = async (newCurr: string) => {
    setCurrency(newCurr);
    try {
      await api.updateSettings({ currency: newCurr });
      onShowToast(`Đã đổi đơn vị tiền tệ sang ${newCurr}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleNotifications = async () => {
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);
    try {
      await api.updateSettings({ notifications_enabled: nextVal });
      onShowToast(nextVal ? 'Đã bật thông báo' : 'Đã tắt thông báo');
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPwdError('Vui lòng điền đầy đủ thông tin mật khẩu');
      return;
    }

    if (newPassword.length < 6) {
      setPwdError('Mật khẩu mới phải từ 6 ký tự trở lên');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPwdError('Mật khẩu nhập lại không trùng khớp');
      return;
    }

    try {
      setIsChangingPwd(true);
      await api.changePassword({ currentPassword, newPassword });
      onShowToast('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPwdError(err.message || 'Lỗi khi đổi mật khẩu');
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await api.exportData();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `financial_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      onShowToast('Đã xuất dữ liệu thành công!');
    } catch (err: any) {
      onShowToast(err.message || 'Lỗi khi xuất dữ liệu', 'error');
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await api.importData(json);
        onShowToast('Nhập dữ liệu thành công! Đang làm mới...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (err: any) {
        onShowToast(err.message || 'Tệp JSON không đúng định dạng', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      await api.deleteAccountData();
      onShowToast('Đã xóa toàn bộ dữ liệu tài khoản');
      logout();
    } catch (err: any) {
      onShowToast(err.message || 'Lỗi khi xóa tài khoản', 'error');
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Category Actions
  const handleOpenAddCategory = (type: 'thu' | 'chi' = catTypeTab, parentId?: string) => {
    setCatToEdit(null);
    setCatName('');
    setCatType(type);
    if (parentId) {
      setCatIsSub(true);
      setCatParentId(parentId);
    } else {
      setCatIsSub(false);
      setCatParentId('');
    }
    setCatError('');
    setIsCatModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setCatToEdit(cat);
    setCatName(cat.name);
    setCatType(cat.type);
    if (cat.parent_id) {
      setCatIsSub(true);
      setCatParentId(cat.parent_id);
    } else {
      setCatIsSub(false);
      setCatParentId('');
    }
    setCatError('');
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError('');

    const trimmedName = catName.trim();
    if (!trimmedName) {
      setCatError('Vui lòng nhập tên danh mục');
      return;
    }

    if (catIsSub && !catParentId) {
      setCatError('Vui lòng chọn danh mục cha cho danh mục con này');
      return;
    }

    const payload = {
      name: trimmedName,
      type: catType,
      parent_id: catIsSub ? catParentId : null,
    };

    try {
      setIsSavingCat(true);
      if (catToEdit) {
        await api.updateCategory(catToEdit.id, payload);
        onShowToast('Cập nhật danh mục thành công!');
      } else {
        await api.createCategory(payload);
        onShowToast('Tạo danh mục mới thành công!');
      }
      setIsCatModalOpen(false);
      if (onRefreshCategories) {
        onRefreshCategories();
      }
    } catch (err: any) {
      setCatError(err.message || 'Lỗi khi lưu danh mục');
    } finally {
      setIsSavingCat(false);
    }
  };

  const handleConfirmDeleteCat = async () => {
    if (!deletingCat) return;

    try {
      setIsDeletingCat(true);
      await api.deleteCategory(deletingCat.id);
      onShowToast(`Đã xóa danh mục "${deletingCat.name}"`);
      setDeletingCat(null);
      if (onRefreshCategories) {
        onRefreshCategories();
      }
    } catch (err: any) {
      onShowToast(err.message || 'Lỗi khi xóa danh mục', 'error');
    } finally {
      setIsDeletingCat(false);
    }
  };

  // Filter category tree by active tab
  const categoryTree = buildCategoryTree(categories, catTypeTab);
  const parentCategoriesOfActiveType = categories.filter((c) => c.type === catType && !c.parent_id && c.id !== catToEdit?.id);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Thông tin tài khoản */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-blue-600" /> Thông tin tài khoản
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold text-slate-400">Họ và tên</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user?.name || 'Người dùng'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Email tài khoản</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user?.email || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Đổi mật khẩu */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-600" /> Đổi mật khẩu
        </h3>

        {pwdError && (
          <div className="p-3 text-xs font-medium rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200">
            {pwdError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nhập lại mật khẩu mới
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isChangingPwd}
            className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
          >
            {isChangingPwd ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
          </button>
        </form>
      </div>

      {/* Quản lý Danh mục (Parent & Subcategories) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-blue-600" /> Quản lý danh mục
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Phân loại thu nhập & chi tiêu theo <b>Danh mục cha</b> và <b>Danh mục con</b>. Các danh mục này sẽ áp dụng khi tạo giao dịch.
            </p>
          </div>

          <button
            onClick={() => handleOpenAddCategory(catTypeTab)}
            className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" /> Thêm danh mục mới
          </button>
        </div>

        {/* Tab switch Thu / Chi */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-64">
          <button
            onClick={() => setCatTypeTab('chi')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              catTypeTab === 'chi'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Chi tiêu (-)
          </button>
          <button
            onClick={() => setCatTypeTab('thu')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              catTypeTab === 'thu'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Thu nhập (+)
          </button>
        </div>

        {/* Categories Tree list */}
        {categoryTree.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Tag className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Chưa có danh mục {catTypeTab === 'chi' ? 'chi tiêu' : 'thu nhập'} nào
            </p>
            <button
              onClick={() => handleOpenAddCategory(catTypeTab)}
              className="mt-3 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              + Tạo danh mục ngay
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {categoryTree.map((parent) => (
              <div
                key={parent.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2"
              >
                {/* Parent Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
                    <span>{parent.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Danh mục cha
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenAddCategory(parent.type, parent.id)}
                      title="Thêm danh mục con"
                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Con
                    </button>
                    <button
                      onClick={() => handleOpenEditCategory(parent)}
                      title="Sửa danh mục cha"
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingCat(parent)}
                      title="Xóa danh mục cha"
                      className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-500 hover:text-rose-700 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subcategories list */}
                {parent.children.length > 0 && (
                  <div className="pl-6 sm:pl-8 pt-1 space-y-1.5 border-l-2 border-blue-200 dark:border-slate-700 ml-3">
                    {parent.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{child.name}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditCategory(child)}
                            title="Sửa danh mục con"
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeletingCat(child)}
                            title="Xóa danh mục con"
                            className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Giao diện & Tiền tệ */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-500" /> Tùy chọn giao diện & Tiền tệ
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Chế độ hiển thị (Theme)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  themeMode === 'light'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" /> Light
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  themeMode === 'dark'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="w-4 h-4 text-blue-400" /> Dark
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Đơn vị tiền tệ mặc định
            </label>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold outline-none"
            >
              <option value="VNĐ">VNĐ (Đồng Việt Nam ₫)</option>
              <option value="USD">USD (Đô la Mỹ $)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Thông báo */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" /> Thông báo
        </h3>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Cảnh báo ngân sách & Giao dịch
            </p>
            <p className="text-xs text-slate-400">
              Nhận thông báo khi giao dịch mới được tạo hoặc ngân sách vượt ngưỡng
            </p>
          </div>
          <button
            onClick={handleToggleNotifications}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              notificationsEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Quản lý dữ liệu */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-600" /> Quản lý Dữ liệu
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExportData}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-blue-600" /> Export dữ liệu (Backup JSON)
          </button>

          <label className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-emerald-600" /> Import dữ liệu
            <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
          </label>
        </div>
      </div>

      {/* Tài khoản & Đăng xuất */}
      <div className="p-6 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-4">
        <h3 className="text-base font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-rose-600" /> Vùng tài khoản nguy hiểm
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={logout}
            className="flex-1 py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất tài khoản
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition-all"
          >
            <Trash2 className="w-4 h-4" /> Xóa toàn bộ tài khoản & dữ liệu
          </button>
        </div>
      </div>

      {/* Category Modal (Create / Edit) */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={catToEdit ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          {catError && (
            <div className="p-3 text-xs font-medium rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              {catError}
            </div>
          )}

          {/* Type selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Loại danh mục
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setCatType('chi');
                  setCatParentId('');
                }}
                className={`py-2 rounded-lg font-semibold text-xs transition-all ${
                  catType === 'chi'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Chi tiêu (-)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCatType('thu');
                  setCatParentId('');
                }}
                className={`py-2 rounded-lg font-semibold text-xs transition-all ${
                  catType === 'thu'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Thu nhập (+)
              </button>
            </div>
          </div>

          {/* Level selection: Parent or Subcategory */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cấp danh mục
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setCatIsSub(false);
                  setCatParentId('');
                }}
                className={`py-2 rounded-lg font-semibold text-xs transition-all ${
                  !catIsSub
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Danh mục cha (Cấp 1)
              </button>
              <button
                type="button"
                onClick={() => setCatIsSub(true)}
                className={`py-2 rounded-lg font-semibold text-xs transition-all ${
                  catIsSub
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Danh mục con (Cấp 2)
              </button>
            </div>
          </div>

          {/* Parent Category selection if subcategory */}
          {catIsSub && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chọn danh mục cha <span className="text-rose-500">*</span>
              </label>
              {parentCategoriesOfActiveType.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  Chưa có danh mục cha nào cho loại này. Hãy tạo một danh mục cha trước!
                </p>
              ) : (
                <select
                  value={catParentId}
                  onChange={(e) => setCatParentId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">-- Chọn danh mục cha --</option>
                  {parentCategoriesOfActiveType.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Name input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tên danh mục <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Ví dụ: Cà phê, Nhà hàng, Lương chính..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCatModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSavingCat || (catIsSub && !catParentId)}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {isSavingCat ? 'Đang lưu...' : 'Lưu danh mục'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Category Modal */}
      <ConfirmDialog
        isOpen={!!deletingCat}
        onClose={() => setDeletingCat(null)}
        onConfirm={handleConfirmDeleteCat}
        title="Xóa danh mục"
        message={
          deletingCat?.parent_id
            ? `Bạn có chắc chắn muốn xóa danh mục con "${deletingCat?.name}" không?`
            : `Bạn có chắc chắn muốn xóa danh mục cha "${deletingCat?.name}" không? Lưu ý: Tất cả các danh mục con trực thuộc cũng sẽ bị xóa.`
        }
        confirmLabel="Đồng ý xóa"
        isLoading={isDeletingCat}
      />

      {/* Delete Account Modal */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Xóa toàn bộ tài khoản"
        message="Hành động này sẽ xóa toàn bộ giao dịch, tài khoản ngân hàng, danh mục và cài đặt của bạn. Dữ liệu không thể phục hồi. Bạn có chắc chắn không?"
        confirmLabel="Đồng ý xóa vĩnh viễn"
        isLoading={isDeletingAccount}
      />
    </div>
  );
};
