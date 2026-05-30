import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Coins,
  Download,
  Loader2,
  ReceiptText,
  Save,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { isAdminRole } from '../auth/roleUtils';
import { useUsers } from '../hooks/useUsers';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));

const formatMonthLabel = (value: string) => {
  const [year, month] = value.split('-');
  return month && year ? `Tháng ${Number(month)}/${year}` : value;
};

const currentMonth = () => new Date().toISOString().slice(0, 7);
const makePayrollKey = (email: string, month: string) => `skymobile-payroll:${email.toLowerCase()}:${month}`;
const toNumber = (value: string | number) => Number(value || 0) || 0;

type PayrollDraft = {
  baseSalary: number;
  allowance: number;
  commission: number;
  bonus: number;
  kpiBonus: number;
  overtime: number;
  deductions: number;
  advance: number;
  insurance: number;
  tax: number;
  note: string;
};

const DEFAULT_PAYROLL: PayrollDraft = {
  baseSalary: 0,
  allowance: 0,
  commission: 0,
  bonus: 0,
  kpiBonus: 0,
  overtime: 0,
  deductions: 0,
  advance: 0,
  insurance: 0,
  tax: 0,
  note: '',
};

const loadPayrollDraft = (email: string, month: string): PayrollDraft => {
  if (typeof window === 'undefined' || !email) return DEFAULT_PAYROLL;
  try {
    const raw = localStorage.getItem(makePayrollKey(email, month));
    if (!raw) return DEFAULT_PAYROLL;
    return { ...DEFAULT_PAYROLL, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PAYROLL;
  }
};

const savePayrollDraft = (email: string, month: string, draft: PayrollDraft) => {
  localStorage.setItem(makePayrollKey(email, month), JSON.stringify(draft));
};

const Field = ({ label, value, onChange, disabled }: { label: string; value: number; onChange: (value: number) => void; disabled: boolean }) => (
  <label className="block">
    <span className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</span>
    <input
      type="number"
      min="0"
      value={value || ''}
      disabled={disabled}
      onChange={(event) => onChange(toNumber(event.target.value))}
      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
      placeholder="0"
    />
  </label>
);

export const PayrollPage = ({ user }: { user: any }) => {
  const isAdmin = isAdminRole(user?.role);
  const { users, loading, error } = useUsers();
  const [month, setMonth] = useState(currentMonth());
  const [search, setSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(user?.email || '');
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const employeeOptions = useMemo(() => {
    const baseUsers = users.length > 0 ? users : [user].filter(Boolean);
    return baseUsers
      .filter(Boolean)
      .filter((item) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return [item.name, item.email, item.role].some(value => String(value || '').toLowerCase().includes(query));
      })
      .sort((a, b) => String(a.name || a.email).localeCompare(String(b.name || b.email), 'vi'));
  }, [users, user, search]);

  const visibleEmail = isAdmin ? (selectedEmail || employeeOptions[0]?.email || user?.email || '') : user?.email;
  const selectedEmployee = useMemo(
    () => employeeOptions.find(item => item.email === visibleEmail) || users.find(item => item.email === visibleEmail) || user,
    [employeeOptions, users, visibleEmail, user]
  );

  const [draft, setDraft] = useState<PayrollDraft>(() => loadPayrollDraft(visibleEmail, month));

  React.useEffect(() => {
    setDraft(loadPayrollDraft(visibleEmail, month));
    setSavedAt(null);
  }, [visibleEmail, month]);

  const updateField = (field: keyof PayrollDraft, value: number | string) => {
    setDraft(prev => ({ ...prev, [field]: value }));
    setSavedAt(null);
  };

  const grossIncome = draft.baseSalary + draft.allowance + draft.commission + draft.bonus + draft.kpiBonus + draft.overtime;
  const totalDeductions = draft.deductions + draft.advance + draft.insurance + draft.tax;
  const netIncome = Math.max(0, grossIncome - totalDeductions);
  const canEdit = isAdmin;

  const handleSave = () => {
    if (!isAdmin || !visibleEmail) return;
    savePayrollDraft(visibleEmail, month, draft);
    setSavedAt(new Date().toLocaleString('vi-VN'));
  };

  const handlePrint = () => window.print();

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-16">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black uppercase tracking-wider mb-3">
            <ReceiptText className="w-3.5 h-3.5" /> Phiếu lương cá nhân
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900">Trang tính phiếu lương</h1>
          <p className="text-slate-500 mt-2 max-w-2xl">
            Nhân viên chỉ xem được phiếu lương của bản thân. Quản trị viên có thể chọn từng nhân viên, nhập các khoản lương/thưởng/khấu trừ và lưu phiếu theo tháng.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="relative">
            <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <button onClick={handlePrint} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800">
            <Download className="w-4 h-4" /> Xuất/In phiếu
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <aside className="xl:col-span-1 space-y-4 print:hidden">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h2 className="font-black text-slate-900">Quyền xem</h2>
            </div>
            <div className={`rounded-2xl p-4 border ${isAdmin ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
              <p className="text-sm font-black">{isAdmin ? 'Quản trị viên' : 'Nhân viên'}</p>
              <p className="text-xs mt-1 font-medium opacity-80">
                {isAdmin ? 'Được chọn và xem phiếu lương của từng nhân viên.' : 'Chỉ xem được phiếu lương của tài khoản đang đăng nhập.'}
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
              <h2 className="font-black text-slate-900 mb-4">Chọn nhân viên</h2>
              <div className="relative mb-3">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm tên, email, vai trò..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>
              {loading ? (
                <div className="py-8 text-center text-slate-500 text-sm"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Đang tải nhân viên...</div>
              ) : error ? (
                <div className="text-sm text-rose-600 flex gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {employeeOptions.map(employee => (
                    <button
                      key={employee.email}
                      onClick={() => setSelectedEmail(employee.email)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all ${visibleEmail === employee.email ? 'border-blue-200 bg-blue-50' : 'border-slate-100 hover:bg-slate-50'}`}
                    >
                      <p className="font-black text-sm text-slate-800 truncate">{employee.name || employee.email}</p>
                      <p className="text-xs text-slate-500 truncate">{employee.role || 'Thành viên'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{employee.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>

        <main className="xl:col-span-3 space-y-6">
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden">
                  {selectedEmployee?.picture ? <img src={selectedEmployee.picture} alt="" className="w-full h-full object-cover" /> : <UserRound className="w-7 h-7" />}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-blue-300">{formatMonthLabel(month)}</p>
                  <h2 className="text-2xl font-black">{selectedEmployee?.name || selectedEmployee?.email || 'Nhân viên'}</h2>
                  <p className="text-sm text-slate-300">{selectedEmployee?.role || 'Thành viên'} · {selectedEmployee?.email}</p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Thực nhận</p>
                <p className="text-3xl font-black text-emerald-300">{formatCurrency(netIncome)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 md:p-8 border-b border-slate-100">
              <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-5">
                <Banknote className="w-6 h-6 text-emerald-600 mb-3" />
                <p className="text-xs font-black uppercase text-emerald-700/70">Tổng thu nhập</p>
                <p className="text-xl font-black text-emerald-700 mt-1">{formatCurrency(grossIncome)}</p>
              </div>
              <div className="rounded-3xl bg-rose-50 border border-rose-100 p-5">
                <Coins className="w-6 h-6 text-rose-600 mb-3" />
                <p className="text-xs font-black uppercase text-rose-700/70">Tổng khấu trừ</p>
                <p className="text-xl font-black text-rose-700 mt-1">{formatCurrency(totalDeductions)}</p>
              </div>
              <div className="rounded-3xl bg-blue-50 border border-blue-100 p-5">
                <CheckCircle2 className="w-6 h-6 text-blue-600 mb-3" />
                <p className="text-xs font-black uppercase text-blue-700/70">Trạng thái</p>
                <p className="text-xl font-black text-blue-700 mt-1">{savedAt ? 'Đã lưu' : canEdit ? 'Bản nháp' : 'Chỉ xem'}</p>
              </div>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-black text-slate-900 text-lg">Khoản thu nhập</h3>
                <Field label="Lương cơ bản" value={draft.baseSalary} onChange={(value) => updateField('baseSalary', value)} disabled={!canEdit} />
                <Field label="Phụ cấp" value={draft.allowance} onChange={(value) => updateField('allowance', value)} disabled={!canEdit} />
                <Field label="Hoa hồng" value={draft.commission} onChange={(value) => updateField('commission', value)} disabled={!canEdit} />
                <Field label="Thưởng" value={draft.bonus} onChange={(value) => updateField('bonus', value)} disabled={!canEdit} />
                <Field label="Thưởng KPI" value={draft.kpiBonus} onChange={(value) => updateField('kpiBonus', value)} disabled={!canEdit} />
                <Field label="Tăng ca / bổ sung" value={draft.overtime} onChange={(value) => updateField('overtime', value)} disabled={!canEdit} />
              </div>

              <div className="space-y-4">
                <h3 className="font-black text-slate-900 text-lg">Khấu trừ & ghi chú</h3>
                <Field label="Khấu trừ khác" value={draft.deductions} onChange={(value) => updateField('deductions', value)} disabled={!canEdit} />
                <Field label="Tạm ứng" value={draft.advance} onChange={(value) => updateField('advance', value)} disabled={!canEdit} />
                <Field label="Bảo hiểm" value={draft.insurance} onChange={(value) => updateField('insurance', value)} disabled={!canEdit} />
                <Field label="Thuế TNCN" value={draft.tax} onChange={(value) => updateField('tax', value)} disabled={!canEdit} />
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Ghi chú</span>
                  <textarea
                    value={draft.note}
                    disabled={!canEdit}
                    onChange={(event) => updateField('note', event.target.value)}
                    rows={5}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="Ghi chú lương, KPI, thưởng/phạt..."
                  />
                </label>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
              <div>
                <p className="text-sm font-bold text-slate-700">Tổng thực nhận: <span className="text-emerald-600 text-lg font-black">{formatCurrency(netIncome)}</span></p>
                {savedAt && <p className="text-xs text-slate-500 mt-1">Đã lưu lúc {savedAt}</p>}
                {!isAdmin && <p className="text-xs text-slate-500 mt-1">Nếu cần điều chỉnh phiếu lương, vui lòng liên hệ quản trị viên.</p>}
              </div>
              {isAdmin && (
                <button onClick={handleSave} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 shadow-lg shadow-blue-100">
                  <Save className="w-4 h-4" /> Lưu phiếu lương
                </button>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
