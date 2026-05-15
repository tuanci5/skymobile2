import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { roleService } from '../services/api';
import { isAdminRole } from '../auth/roleUtils';

interface User {
  email: string;
  name: string;
  picture?: string;
  role: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  login: (userData: any) => void;
  logout: () => void;
  hasPermission: (tab: string) => boolean;
  rolePermissions: any[];
  refreshPermissions: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
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
    localStorage.removeItem('user');
  };

  const hasPermission = (tab: string) => {
    if (!user) return false;
    if (isAdminRole(user.role)) return true;

    const roleConfig = rolePermissions.find(rp => rp.role === user.role);
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
      user, 
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
