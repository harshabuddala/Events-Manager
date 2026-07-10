'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Users, FileText, ShoppingBag, UserCheck, 
  BarChart3, Settings, Users2, ChevronDown, GraduationCap,
  PieChart as PieChartIcon, TrendingUp, FileOutput, X, LogOut,
  ScanLine, ClipboardCheck, Clock, Star, HelpCircle, Smartphone, FileImage, Key, MessageCircle, CreditCard, GitBranch
} from 'lucide-react';
import QrLoginGenerator from './QrLoginGenerator';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const mainNavItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR'] },
  { path: '/events', label: 'Events', icon: Calendar, roles: ['ADMIN', 'MANAGER', 'VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR'] },
  { path: '/communities', label: 'Communities', icon: Users, roles: ['ADMIN', 'MANAGER'] },
  { path: '/registrations', label: 'Registrations', icon: FileText, roles: ['ADMIN', 'MANAGER'] },
  { path: '/stalls', label: 'Stalls', icon: ShoppingBag, roles: ['ADMIN', 'MANAGER'] },
  { path: '/volunteers', label: 'Volunteers', icon: UserCheck, roles: ['ADMIN', 'MANAGER', 'VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR'] },
];

const volunteerNavItems: NavItem[] = [
  { path: '/scan', label: 'Scan Student', icon: ScanLine, roles: ['VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR'] },
  { path: '/my-evaluations', label: 'My Evaluations', icon: ClipboardCheck, roles: ['VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR'] },
  { path: '/my-schedule', label: 'My Schedule', icon: Clock, roles: ['VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR'] },
  { path: '/my-performance', label: 'My Performance', icon: Star, roles: ['VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR'] },
];

const analyticsNavItems: NavItem[] = [
  { path: '/analytics/overview', label: 'Overview', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  { path: '/analytics/stalls', label: 'Stall Analytics', icon: PieChartIcon, roles: ['ADMIN', 'MANAGER'] },
  { path: '/analytics/communities', label: 'Community Analytics', icon: Users2, roles: ['ADMIN', 'MANAGER'] },
  { path: '/analytics/volunteers', label: 'Volunteer Performance', icon: TrendingUp, roles: ['ADMIN', 'MANAGER'] },
];

const settingsNavItems: NavItem[] = [
  { path: '/settings/users', label: 'Users & Roles', icon: Users, roles: ['ADMIN', 'MANAGER'] },
  { path: '/settings/api', label: 'API', icon: Key, roles: ['ADMIN'] },
  { path: '/settings/twilio', label: 'Twilio Settings', icon: MessageCircle, roles: ['ADMIN'] },
  { path: '/settings/whatsapp-logs', label: 'WhatsApp Logs', icon: FileOutput, roles: ['ADMIN', 'MANAGER'] },
  { path: '/settings/razorpay', label: 'Razorpay', icon: CreditCard, roles: ['ADMIN'] },
  { path: '/settings/general', label: 'Settings', icon: Settings, roles: ['ADMIN', 'MANAGER'] },
];

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showQrLogin, setShowQrLogin] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // ignore
      }
    }
    fetchUser();
  }, []);

  const userRole = user?.role || '';
  const isVolunteerRole = ['VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR'].includes(userRole);

  const filterByRole = (items: NavItem[]) => items.filter(item => item.roles.includes(userRole));

  const visibleMainNav = filterByRole(mainNavItems);
  const visibleVolunteerNav = filterByRole(volunteerNavItems);
  const visibleAnalyticsNav = filterByRole(analyticsNavItems);
  const visibleSettingsNav = filterByRole(settingsNavItems);

  const isCurrent = (path: string) => pathname === path;

  const getLinkClasses = (path: string) => {
    if (isCurrent(path)) {
      return "flex items-center gap-3 px-3.5 py-3 bg-violet-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-violet-600/20";
    }
    return "flex items-center gap-3 px-3.5 py-3 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-xl font-semibold transition-colors";
  };

  const getIconClasses = (path: string) => {
    return isCurrent(path) ? "w-[20px] h-[20px] opacity-90" : "w-[20px] h-[20px] opacity-80";
  };

  const handleLogout = async () => {
    if (!showLogoutConfirm) {
      setShowLogoutConfirm(true);
      setTimeout(() => setShowLogoutConfirm(false), 3000);
      return;
    }

    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch {
      // ignore
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className={`fixed lg:sticky top-0 left-0 w-[280px] sm:w-[260px] flex-shrink-0 bg-gradient-to-b from-[#0A0F2D] to-[#121B45] text-slate-300 flex flex-col h-[100dvh] border-r border-[#1e274a] shadow-xl z-[60] transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Logo Area */}
        <div className="p-4 sm:p-5 pb-2 flex items-start justify-between safe-area-top">
          <div>
            <div className="flex items-center gap-2.5 text-white mb-1">
              <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/20">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight leading-none tracking-[-0.02em]">Edunura</h1>
              </div>
            </div>
            <p className="text-[9px] text-slate-400/80 font-semibold tracking-wider uppercase mt-1.5 ml-1">Learn Today, Lead Tomorrow</p>
          </div>
          <button 
            className="lg:hidden p-2.5 text-slate-400 hover:text-white mt-1 rounded-xl hover:bg-white/10 transition-colors"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pt-4 sm:pt-6 pb-4 px-3 custom-scrollbar">
          
          {/* Main Nav */}
          <div className="space-y-1">
            {visibleMainNav.map(item => (
              <Link key={item.path} href={item.path} className={getLinkClasses(item.path)} onClick={() => setIsOpen(false)}>
                <item.icon className={getIconClasses(item.path)} />
                <span className="text-[13px]">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Volunteer-specific Nav */}
          {visibleVolunteerNav.length > 0 && (
            <>
              <div className="mt-6 mb-2 px-3">
                <h3 className="text-[10px] font-bold text-slate-500/80 tracking-widest uppercase">My Work</h3>
              </div>
              <div className="space-y-1">
                {visibleVolunteerNav.map(item => (
                  <Link key={item.path} href={item.path} className={getLinkClasses(item.path)} onClick={() => setIsOpen(false)}>
                    <item.icon className={getIconClasses(item.path)} />
                    <span className="text-[13px]">{item.label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Analytics Nav */}
          {visibleAnalyticsNav.length > 0 && (
            <>
              <div className="mt-6 mb-2 px-3">
                <h3 className="text-[10px] font-bold text-slate-500/80 tracking-widest uppercase">Analytics</h3>
              </div>
              <div className="space-y-1">
                {visibleAnalyticsNav.map(item => (
                  <Link key={item.path} href={item.path} className={getLinkClasses(item.path)} onClick={() => setIsOpen(false)}>
                    <item.icon className={getIconClasses(item.path)} />
                    <span className="text-[13px]">{item.label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Settings Nav */}
          {visibleSettingsNav.length > 0 && (
            <>
              <div className="mt-6 mb-2 px-3">
                <h3 className="text-[10px] font-bold text-slate-500/80 tracking-widest uppercase">Settings</h3>
              </div>
              <div className="space-y-1">
                {visibleSettingsNav.map(item => (
                  <Link key={item.path} href={item.path} className={getLinkClasses(item.path)} onClick={() => setIsOpen(false)}>
                    <item.icon className={getIconClasses(item.path)} />
                    <span className="text-[13px]">{item.label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-white/5 bg-black/10 safe-area-bottom">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group mb-2">
            <div className="w-9 h-9 rounded-full bg-violet-600/20 border-2 border-slate-700/50 group-hover:border-violet-500 transition-colors flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-200 truncate group-hover:text-white transition-colors">{user?.name || 'User'}</p>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {user?.role ? user.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : 'User'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
          </div>
          
          <button
            onClick={() => setShowQrLogin(true)}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-colors font-semibold text-[13px] text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 active:scale-[0.98] mb-1"
          >
            <Smartphone className="w-[20px] h-[20px] opacity-80" />
            <span>Mobile Login QR</span>
          </button>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-colors font-semibold text-[13px] disabled:opacity-50 active:scale-[0.98] ${
              showLogoutConfirm 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <LogOut className="w-[20px] h-[20px] opacity-80" />
            <span>
              {isLoggingOut ? 'Signing out...' : showLogoutConfirm ? 'Click again to confirm' : 'Sign Out'}
            </span>
          </button>
        </div>
      </aside>

      <QrLoginGenerator isOpen={showQrLogin} onClose={() => setShowQrLogin(false)} />
    </>
  );
}
