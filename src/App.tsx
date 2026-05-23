/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import { InterviewPage } from './pages/InterviewPage';
import { ProductsPage } from './pages/ProductsPage';
import { RecruitmentPlanPage } from './pages/RecruitmentPlanPage';
import { UserPage } from './pages/UserPage';
import { TaskPage } from './pages/TaskPage';
import { MessengerPage } from './pages/MessengerPage';
import { RevenuePage } from './pages/RevenuePage';
import { HRPage } from './pages/HRPage';
import { TrainingPage } from './pages/TrainingPage';
import { BusinessPlanPage } from './pages/BusinessPlanPage';
import { ModelPage } from './pages/ModelPage';
import { SettingsPage } from './pages/SettingsPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDebtsPage } from './pages/CustomerDebtsPage';

import { MobileMessengerPage } from './pages/mobile/MobileMessengerPage';
import { MobileTaskPage } from './pages/mobile/MobileTaskPage';
import { MobileProductsPage } from './pages/mobile/MobileProductsPage';
import { MobileRevenuePage } from './pages/mobile/MobileRevenuePage';
import { MobileMenuPage } from './pages/mobile/MobileMenuPage';

import { ROLE_MAPPING } from './auth/roleMapping';
import { isAdminRole } from './auth/roleUtils';
import { AppShell } from './layout/AppShell';
import { MobileShell } from './layout/MobileShell';
import { useIsMobile } from './hooks/useIsMobile';
import { PATH_TO_TAB, TAB_TO_PATH } from './routing/navigation';
import { TabType } from './types';

import { LECTURE_CULTURE_ATTITUDE } from './data/lecture_culture_attitude';
import { LECTURE_RESPONSIBILITY } from './data/lecture_responsibility';
import { LECTURE_PROFESSIONAL_CONDUCT } from './data/lecture_professional_conduct';

const GOOGLE_CLIENT_ID = '637002508826-b7jmlrenhbagrh6rjp4m4uq8n210fq9a.apps.googleusercontent.com';

function AppContent() {
  const { user, logout, hasPermission, rolePermissions, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // --- Derive navigation state from URL ---
  const isMobile = useIsMobile();

  const pathParts = pathname.replace(/^\//, '').split('/');
  const rootSeg = pathParts[0] || 'model';
  const subSeg = pathParts[1] || '';
  const teamSeg = pathParts[2] || '';

  const activeTab: TabType = (rootSeg === 'mobile-menu' ? 'model' : PATH_TO_TAB[rootSeg]) ?? 'model';
  const isMobileMenu = rootSeg === 'mobile-menu';
  const activeDept = (activeTab === 'model' && ['sales-mkt', 'comms-dept', 'hr-dept', 'finance-dept', 'technical'].includes(subSeg)) ? subSeg : null;
  const activeTeam = (activeDept === 'sales-mkt' && ['marketing', 'sale', 'cskh'].includes(teamSeg)) ? teamSeg as any : null;
  const hrSubTab = activeTab === 'hr' ? (subSeg === 'interview' ? 'interview' : (subSeg === 'plan' ? 'plan' : 'jd')) : 'jd';
  const settingsSubPage = rootSeg === 'users' || (activeTab === 'settings' && subSeg === 'users') ? 'users' : 'general';

  const LECTURE_SLUGS: Record<string, any> = {
    'van-hoa': LECTURE_CULTURE_ATTITUDE,
    'trach-nhiem': LECTURE_RESPONSIBILITY,
    'tac-phong': LECTURE_PROFESSIONAL_CONDUCT,
  };

  const internalRoleId = user?.role ? (ROLE_MAPPING[user.role] || 'guest') : null;
  const isSystemAdmin = user ? isAdminRole(user.role) : false;
  const [activeRole, setActiveRole] = useState<string>(isSystemAdmin ? 'head' : (internalRoleId || 'head'));

  useEffect(() => {
    if (user && !isSystemAdmin) {
      setActiveRole(internalRoleId || 'head');
    }
  }, [user, internalRoleId, isSystemAdmin]);

  useEffect(() => {
    if (rootSeg === 'users') {
      navigate('/settings/users', { replace: true });
      return;
    }
    if (pathname === '/' || pathname === '' || rootSeg === 'accounts') {
      navigate('/model', { replace: true });
    }
  }, [pathname, rootSeg, navigate]);

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center">Loading permissions...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  const userPerms = rolePermissions.find(p => p.role === user.role);
  const allowedTabs = (() => {
    if (isSystemAdmin) return [];
    if (!userPerms) return [];
    if (Array.isArray(userPerms.allowed_tabs)) return userPerms.allowed_tabs;
    if (typeof userPerms.allowed_tabs === 'string') {
      try {
        const parsed = JSON.parse(userPerms.allowed_tabs);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error('Invalid allowed_tabs format:', error);
        return [];
      }
    }
    return [];
  })();
  const restrictedView = !isSystemAdmin && internalRoleId !== 'admin';
  const requiredPermissionTab: TabType = settingsSubPage === 'users' ? 'users' : activeTab;

  const goToTab = (tab: TabType) => {
    if (!hasPermission(tab)) {
      alert('Bạn không có quyền truy cập mục này.');
      return;
    }
    navigate(TAB_TO_PATH[tab]);
  };

  // ── MOBILE LAYOUT ──
  if (isMobile) {
    return (
      <MobileShell activeTab={activeTab} routeKey={pathname}>
        {isMobileMenu ? (
          <MobileMenuPage user={user} onLogout={logout} isSystemAdmin={isSystemAdmin} allowedTabs={allowedTabs} />
        ) : !hasPermission(requiredPermissionTab) ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-6 px-6">
            <div className="p-6 bg-rose-100 text-rose-600 rounded-full"><ShieldAlert className="w-12 h-12" /></div>
            <h2 className="text-xl font-bold text-slate-900 text-center">Truy cập bị từ chối</h2>
            <button onClick={() => navigate('/model')} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm">Quay lại</button>
          </div>
        ) : (
          <>
            {activeTab === 'messenger' && <MobileMessengerPage user={user} />}
            {activeTab === 'tasks' && <MobileTaskPage currentUser={user} />}
            {activeTab === 'products' && <MobileProductsPage />}
            {activeTab === 'revenue' && <MobileRevenuePage user={user} />}
            {/* Fallback: desktop pages rendered on mobile for other tabs */}
            {activeTab === 'model' && !isMobileMenu && (
              <div className="p-4 pb-24">
                <ModelPage activeDept={activeDept} activeTeam={activeTeam} activeRole={activeRole} setActiveRole={setActiveRole}
                  goToDept={(dept) => navigate(dept ? `/model/${dept}` : '/model')}
                  goToTeam={(team) => navigate(team ? `/model/sales-mkt/${team}` : '/model/sales-mkt')} />
              </div>
            )}
            {activeTab === 'hr' && <div className="p-4 pb-24"><HRPage selectedRole={restrictedView ? internalRoleId : activeRole} setSelectedRole={restrictedView ? () => {} : setActiveRole} setActiveTab={goToTab} restricted={restrictedView} hrSubTab={hrSubTab} user={user} /></div>}
            {activeTab === 'training' && <div className="p-4 pb-24"><TrainingPage courseSlug={subSeg === 'course' ? teamSeg : null} lectureSlug={subSeg === 'lecture' ? teamSeg : null} lectureData={subSeg === 'lecture' ? LECTURE_SLUGS[teamSeg] : null} /></div>}
            {activeTab === 'business' && <div className="p-4 pb-24"><BusinessPlanPage initialSubTab="finance" /></div>}
            {activeTab === 'customers' && <div className="p-4 pb-24"><CustomersPage /></div>}
            {activeTab === 'customer-debts' && <div className="p-4 pb-24"><CustomerDebtsPage /></div>}
            {activeTab === 'settings' && (
              <div className="p-4 pb-24">
                {settingsSubPage === 'users' ? <UserPage /> : <SettingsPage />}
              </div>
            )}
          </>
        )}
      </MobileShell>
    );
  }

  // ── DESKTOP LAYOUT (unchanged) ──
  return (
    <AppShell
      activeTab={activeTab}
      activeDept={activeDept}
      hrSubTab={hrSubTab}
      onLogout={logout}
      user={user}
      allowedTabs={allowedTabs}
      isSystemAdmin={isSystemAdmin}
      routeKey={pathname}
    >
      {!hasPermission(requiredPermissionTab) ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-6">
          <div className="p-6 bg-rose-100 text-rose-600 rounded-full shadow-lg shadow-rose-100">
            <ShieldAlert className="w-16 h-16" />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">Truy cập bị từ chối</h2>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">Tài khoản của bạn không có quyền truy cập vào mục này.</p>
          </div>
          <button onClick={() => navigate('/model')} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold">
            Quay lại Trang chủ
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'model' && (
            <ModelPage
              activeDept={activeDept}
              activeTeam={activeTeam}
              activeRole={activeRole}
              setActiveRole={setActiveRole}
              goToDept={(dept) => navigate(dept ? `/model/${dept}` : '/model')}
              goToTeam={(team) => navigate(team ? `/model/sales-mkt/${team}` : '/model/sales-mkt')}
            />
          )}
          {activeTab === 'hr' && (
            <HRPage
              selectedRole={restrictedView ? internalRoleId : activeRole}
              setSelectedRole={restrictedView ? () => { } : setActiveRole}
              setActiveTab={goToTab}
              restricted={restrictedView}
              hrSubTab={hrSubTab}
              user={user}
            />
          )}
          {activeTab === 'training' && (
            <TrainingPage 
              courseSlug={subSeg === 'course' ? teamSeg : null}
              lectureSlug={subSeg === 'lecture' ? teamSeg : null}
              lectureData={subSeg === 'lecture' ? LECTURE_SLUGS[teamSeg] : null}
            />
          )}
          {activeTab === 'business' && <BusinessPlanPage initialSubTab="finance" />}
          {activeTab === 'action-plan' && <BusinessPlanPage initialSubTab="action" />}
          {activeTab === 'tasks' && <TaskPage currentUser={user} />}
          {activeTab === 'products' && <ProductsPage />}
          {activeTab === 'messenger' && <MessengerPage user={user} />}
          {activeTab === 'revenue' && <RevenuePage user={user} />}
          {activeTab === 'customers' && <CustomersPage />}
          {activeTab === 'customer-debts' && <CustomerDebtsPage />}
          {activeTab === 'settings' && (settingsSubPage === 'users' ? <UserPage /> : <SettingsPage />)}
        </>
      )}
    </AppShell>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppContent />
    </GoogleOAuthProvider>
  );
}
