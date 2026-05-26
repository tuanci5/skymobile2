import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { roleService } from '../services/api';
import { isAdminRole, isSameRoleGroup } from '../auth/roleUtils';

interface User {
  email: string;
  name: string;
  picture?: string;
  role: string;
  permissions?: string[];
  manager_email?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  realUser: User | null;
  simulatedRole: string | null;
  simulatedUser: User | null;
  setSimulatedUser: (user: User | null) => void;
  login: (userData: any) => void;
  logout: () => void;
  hasPermission: (tab: string) => boolean;
  rolePermissions: any[];
  refreshPermissions: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStoredSimulatedUser = (): User | null => {
  const saved = localStorage.getItem('simulatedUser');
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch (error) {
    console.error('Invalid simulated user in localStorage:', error);
    localStorage.removeItem('simulatedUser');
    localStorage.removeItem('simulatedRole');
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [simulatedUser, setSimulatedUserState] = useState<User | null>(() => getStoredSimulatedUser());
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    try {
      const data = await roleService.getPermissions();
      setRolePermissions(data);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const login = (userData: any) => {
    const formattedUser = {
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      picture: userData.picture,
      role: userData.role || 'Thành viên',
      permissions: userData.permissions || [],
    };
    setUser(formattedUser);
    localStorage.setItem('user', JSON.stringify(formattedUser));
  };

  const logout = () => {
    setUser(null);
    setSimulatedUserState(null);
    localStorage.removeItem('user');
    localStorage.removeItem('simulatedRole');
    localStorage.removeItem('simulatedUser');
  };

  const setSimulatedUser = (nextUser: User | null) => {
    setSimulatedUserState(nextUser);
    if (nextUser) {
      localStorage.setItem('simulatedUser', JSON.stringify(nextUser));
      localStorage.setItem('simulatedRole', nextUser.role);
    } else {
      localStorage.removeItem('simulatedUser');
      localStorage.removeItem('simulatedRole');
    }
  };

  const isRealAdmin = user ? isAdminRole(user.role) : false;
  const activeSimulatedUser = isRealAdmin ? simulatedUser : null;
  const effectiveUser = user ? (activeSimulatedUser || user) : null;

  const hasPermission = (tab: string) => {
    if (!effectiveUser) return false;
    if (isAdminRole(effectiveUser.role)) return true;

    const roleConfig = rolePermissions.find(rp => isSameRoleGroup(rp.role, effectiveUser.role));
    if (!roleConfig) return false;

    try {
      const allowed = Array.isArray(roleConfig.allowed_tabs)
        ? roleConfig.allowed_tabs
        : (typeof roleConfig.allowed_tabs === 'string' ? JSON.parse(roleConfig.allowed_tabs) : []);
      return Array.isArray(allowed) && allowed.includes(tab);
    } catch (error) {
      console.error('Invalid role permissions format:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user: effectiveUser,
      realUser: user,
      simulatedRole: activeSimulatedUser?.role || null,
      simulatedUser: activeSimulatedUser,
      setSimulatedUser,
      login,
      logout,
      hasPermission,
      rolePermissions,
      refreshPermissions: fetchPermissions,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
