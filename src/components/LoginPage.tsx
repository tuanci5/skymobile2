import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { motion } from 'motion/react';
import { ShieldCheck, Loader2, AlertCircle, Lock, Wifi, FlaskConical } from 'lucide-react';

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');

// ── Dev-only demo accounts ──────────────────────────────────────────────────
const DEV_ACCOUNTS = [
  {
    label: 'Quản trị (System Admin)',
    user: {
      email: 'admin@skymobile.dev',
      name: 'System Administrator',
      picture: 'https://api.dicebear.com/9.x/initials/svg?seed=AD&backgroundColor=3b82f6&textColor=ffffff',
      role: 'Quản trị',
    },
  },
  {
    label: 'Trưởng nhóm Marketing',
    user: {
      email: 'mkt_lead@skymobile.dev',
      name: 'Marketing Lead',
      picture: 'https://api.dicebear.com/9.x/initials/svg?seed=ML&backgroundColor=8b5cf6&textColor=ffffff',
      role: 'Trưởng nhóm Marketing',
    },
  },
  {
    label: 'Trưởng nhóm Sale',
    user: {
      email: 'sale_lead@skymobile.dev',
      name: 'Sale Lead',
      picture: 'https://api.dicebear.com/9.x/initials/svg?seed=SL&backgroundColor=10b981&textColor=ffffff',
      role: 'Trưởng nhóm Sale',
    },
  },
  {
    label: 'Trưởng nhóm CSKH',
    user: {
      email: 'cskh_lead@skymobile.dev',
      name: 'CSKH Lead',
      picture: 'https://api.dicebear.com/9.x/initials/svg?seed=CL&backgroundColor=f59e0b&textColor=ffffff',
      role: 'Trưởng nhóm CSKH',
    },
  },
  {
    label: 'Nhân viên Quảng cáo',
    user: {
      email: 'ads@skymobile.dev',
      name: 'Ads Specialist',
      picture: 'https://api.dicebear.com/9.x/initials/svg?seed=AS&backgroundColor=ef4444&textColor=ffffff',
      role: 'Nhân viên Quảng cáo',
    },
  },
  {
    label: 'Nhân viên Content',
    user: {
      email: 'content@skymobile.dev',
      name: 'Content Creator',
      picture: 'https://api.dicebear.com/9.x/initials/svg?seed=CC&backgroundColor=ec4899&textColor=ffffff',
      role: 'Nhân viên Content',
    },
  },
  {
    label: 'Nhân viên Sale',
    user: {
      email: 'sale@skymobile.dev',
      name: 'Sale Executive',
      picture: 'https://api.dicebear.com/9.x/initials/svg?seed=SE&backgroundColor=06b6d4&textColor=ffffff',
      role: 'Nhân viên Sale',
    },
  },
  {
    label: 'Nhân viên Kế toán',
    user: {
      email: 'accountant@skymobile.dev',
      name: 'Accountant',
      picture: 'https://api.dicebear.com/9.x/initials/svg?seed=AC&backgroundColor=6366f1&textColor=ffffff',
      role: 'Nhân viên kế toán tổng hợp',
    },
  },
  {
    label: 'Nhân viên HCNS',
    user: {
      email: 'hr@skymobile.dev',
      name: 'HR Admin',
      picture: 'https://api.dicebear.com/9.x/initials/svg?seed=HR&backgroundColor=f97316&textColor=ffffff',
      role: 'Nhân viên Hành chính & Nhân sự',
    },
  },
  {
    label: 'Telesale',
    user: {
      email: 'telesale@skymobile.dev',
      name: 'Telesale Staff',
      picture: 'https://api.dicebear.com/9.x/initials/svg?seed=TS&backgroundColor=84cc16&textColor=ffffff',
      role: 'Telesale',
    },
  },
];

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDevMenu, setShowDevMenu] = useState(false);

  // Only shows dev button in Vite dev mode
  const isDev = import.meta.env.DEV;

  const handleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const decoded: GoogleUser = jwtDecode(credentialResponse.credential);
      const userEmail = decoded.email.toLowerCase();

      // NEW: Check authentication from database instead of Google Sheet
      const response = await fetch(`${API_BASE_URL}/api/auth/verify?email=${encodeURIComponent(userEmail)}`);
      
      if (!response.ok) {
        throw new Error('Không thể kết nối với máy chủ xác thực');
      }

      const data = await response.json();

      if (data.authorized) {
        // Use user data from database (role, name)
        onLoginSuccess({ 
          ...decoded, 
          name: data.user.name || decoded.name,
          role: data.user.role || 'Thành viên',
          picture: data.user.picture || decoded.picture
        });
      } else {
        setError(`Email ${userEmail} không có trong danh sách được phép. Vui lòng liên hệ Quản trị viên.`);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Đã có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0f1a] flex flex-col items-center justify-center p-4 selection:bg-blue-500/30">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl shadow-blue-900/20">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 mb-6 transition-transform hover:scale-110">
              <Wifi className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Sky Mobile Dashboard</h1>
            <p className="text-slate-400 text-sm font-medium">Hệ thống Quản trị Doanh nghiệp</p>
          </div>

          {/* Info Card */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 mb-8 flex items-start gap-4">
            <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-blue-200 text-sm font-bold mb-1">Xác thực 2 Lớp</h3>
              <p className="text-blue-200/60 text-xs leading-relaxed">
                Hệ thống yêu cầu đăng nhập tài khoản Google và kiểm tra email thủ công để cấp quyền truy cập.
              </p>
            </div>
          </div>

          {/* Login Section */}
          <div className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-200 text-xs leading-relaxed">{error}</p>
              </motion.div>
            )}

            {/* Google Login */}
            <div className="relative flex justify-center py-2">
              {isLoading ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                  <p className="text-blue-200/50 text-sm animate-pulse">Đang kiểm tra quyền hạn...</p>
                </div>
              ) : (
                <div className="w-full transform transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={() => setError('Đăng nhập thất bại. Vui lòng thử lại.')}
                    useOneTap
                    theme="filled_blue"
                    shape="pill"
                    width="100%"
                    text="continue_with"
                  />
                </div>
              )}
            </div>

            {/* ── DEV ONLY: Demo login bypass ── */}
            {isDev && (
              <div className="border-t border-white/10 pt-5">
                <button
                  onClick={() => setShowDevMenu(v => !v)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-bold hover:bg-amber-500/20 transition-colors"
                >
                  <FlaskConical className="w-4 h-4" />
                  Đăng nhập Demo (Dev Only)
                </button>

                {showDevMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 space-y-2"
                  >
                    {DEV_ACCOUNTS.map(acc => (
                      <button
                        key={acc.label}
                        onClick={() => onLoginSuccess(acc.user)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors group"
                      >
                        <img
                          src={acc.user.picture}
                          alt=""
                          className="w-8 h-8 rounded-full shrink-0"
                        />
                        <div>
                          <p className="text-white text-sm font-bold leading-tight">{acc.label}</p>
                          <p className="text-slate-500 text-xs">{acc.user.email}</p>
                        </div>
                        <span className="ml-auto text-slate-600 group-hover:text-white transition-colors text-xs">→</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-2">
              <Lock className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Authorized Personnel Only</span>
            </div>
          </div>
        </div>

        <p className="text-center mt-10 text-slate-600 text-sm">
          &copy; 2026 Sky Mobile. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
