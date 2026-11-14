import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  RefreshCw,
  FolderLock,
  Package,
  CheckSquare,
  BarChart3,
  Bell,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  Home,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen,
  onClose
}) => {
  const { user, workspaces, currentWorkspace, switchWorkspace, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Bills', path: '/bills', icon: Receipt },
    { name: 'Subscriptions', path: '/subscriptions', icon: RefreshCw },
    { name: 'Documents Vault', path: '/documents', icon: FolderLock },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Notifications', path: '/notifications', icon: Bell }
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col transition-transform duration-200 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand & Logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <NavLink to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm shadow-emerald-600/30">
            K
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              Keepr
            </span>
            <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 -mt-0.5">
              Operations Platform
            </span>
          </div>
        </NavLink>
      </div>

      {/* Workspace Switcher */}
      <div className="px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider px-2 mb-1.5">
          Active Workspace
        </div>
        <div className="relative">
          <select
            value={currentWorkspace?.id || ''}
            onChange={(e) => switchWorkspace(e.target.value)}
            className="w-full appearance-none bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name} ({ws.type === 'HOUSEHOLD' ? 'Household' : 'Personal'})
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Controls */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1">
        <NavLink
          to="/workspace-settings"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`
          }
        >
          <Settings className="w-4 h-4" />
          <span>Workspace Settings</span>
        </NavLink>

        <NavLink
          to="/account-settings"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`
          }
        >
          <User className="w-4 h-4" />
          <span>Account Settings</span>
        </NavLink>

        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 p-1.5 rounded-lg"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
