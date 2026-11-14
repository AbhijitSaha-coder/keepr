import React from 'react';
import { Menu, Bell, User, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { Badge } from '../common/Badge';

export const Navbar: React.FC<{ onOpenMobileMenu: () => void }> = ({ onOpenMobileMenu }) => {
  const { user, currentWorkspace } = useAuth();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      {/* Left: Mobile trigger & Workspace Indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {currentWorkspace?.name || 'Keepr'}
          </span>
          {currentWorkspace && (
            <Badge variant={currentWorkspace.type === 'HOUSEHOLD' ? 'green' : 'blue'} size="sm">
              {currentWorkspace.type}
            </Badge>
          )}
        </div>
      </div>

      {/* Right: Actions & User Info */}
      <div className="flex items-center gap-3">
        <NavLink
          to="/notifications"
          className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Bell className="w-5 h-5" />
        </NavLink>

        <NavLink
          to="/account-settings"
          className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
            {user?.firstName?.[0] || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">{user?.email}</div>
          </div>
        </NavLink>
      </div>
    </header>
  );
};
