import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { User, WorkspaceSummary } from '../types';

interface AuthContextType {
  user: User | null;
  workspaces: WorkspaceSummary[];
  currentWorkspace: WorkspaceSummary | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => void;
  refreshWorkspaces: () => Promise<void>;
  updateCurrentUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    const token = api.getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [profileData, workspacesData] = await Promise.all([
        api.get<User>('/users/profile'),
        api.get<WorkspaceSummary[]>('/workspaces')
      ]);

      setUser(profileData);
      setWorkspaces(workspacesData);

      const savedWorkspaceId = api.getCurrentWorkspaceId();
      const matched = workspacesData.find(w => w.id === savedWorkspaceId);
      const active = matched || workspacesData[0] || null;

      setCurrentWorkspace(active);
      if (active) {
        api.setCurrentWorkspaceId(active.id);
      }
    } catch (err) {
      api.setAccessToken(null);
      setUser(null);
      setWorkspaces([]);
      setCurrentWorkspace(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (credentials: any) => {
    const res = await api.post<any>('/auth/login', credentials);
    api.setAccessToken(res.accessToken);
    if (res.refreshToken) {
      localStorage.setItem('keepr_refresh_token', res.refreshToken);
    }
    setUser(res.user);
    setWorkspaces(res.workspaces);

    const defaultWs = res.currentWorkspace || res.workspaces[0] || null;
    setCurrentWorkspace(defaultWs);
    if (defaultWs) {
      api.setCurrentWorkspaceId(defaultWs.id);
    }
  };

  const register = async (data: any) => {
    await api.post('/auth/register', data);
    // After register, automatically log in
    await login({ email: data.email, password: data.password });
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    api.setAccessToken(null);
    api.setCurrentWorkspaceId(null);
    localStorage.removeItem('keepr_refresh_token');
    setUser(null);
    setWorkspaces([]);
    setCurrentWorkspace(null);
  };

  const switchWorkspace = (workspaceId: string) => {
    const ws = workspaces.find(w => w.id === workspaceId);
    if (ws) {
      setCurrentWorkspace(ws);
      api.setCurrentWorkspaceId(ws.id);
      window.location.reload(); // Reload context cleanly for new workspace
    }
  };

  const refreshWorkspaces = async () => {
    try {
      const wsData = await api.get<WorkspaceSummary[]>('/workspaces');
      setWorkspaces(wsData);
      if (!currentWorkspace && wsData.length > 0) {
        setCurrentWorkspace(wsData[0]);
        api.setCurrentWorkspaceId(wsData[0].id);
      }
    } catch {}
  };

  const updateCurrentUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspaces,
        currentWorkspace,
        loading,
        login,
        register,
        logout,
        switchWorkspace,
        refreshWorkspaces,
        updateCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
