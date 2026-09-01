import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore, isAdminRole, isCoordinatorRole, isRegistrationDeskRole } from '../store/authStore';
import { api } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, User, Calendar, ClipboardList, Users, Bell,
  LogOut, ChevronRight, CreditCard, Trophy,
  UserPlus, Megaphone, Upload, CheckSquare, Shield, GraduationCap, Award, Settings
} from 'lucide-react';

// ── Nav item definitions per role ──────────────────────────────────────────

const participantNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/profile', icon: User, label: 'My Profile' },
  { to: '/dashboard/events', icon: Calendar, label: 'Events' },
  { to: '/dashboard/payment', icon: CreditCard, label: 'Registration Fee' },
  { to: '/dashboard/registrations', icon: ClipboardList, label: 'My Registrations' },
  { to: '/dashboard/certificates', icon: Award, label: 'E-Certificates' },
  { to: '/dashboard/winners', icon: Trophy, label: 'Winners & Results' },
  { to: '/dashboard/teams', icon: Users, label: 'My Teams' },
  { to: '/dashboard/notifications', icon: Bell, label: 'Notifications', badge: true },
];

const adminNavItems = [
  { to: '/dashboard/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/dashboard/admin/users', icon: UserPlus, label: 'User Management' },
  { to: '/dashboard/admin/coordinators', icon: Shield, label: 'Staff & Coordinators' },
  { to: '/dashboard/admin/participants', icon: Users, label: 'Participants' },
  { to: '/dashboard/admin/registrations', icon: ClipboardList, label: 'Registrations' },
  { to: '/dashboard/admin/alumni', icon: GraduationCap, label: 'Alumni' },
  { to: '/dashboard/admin/payments', icon: CreditCard, label: 'Payments' },
  { to: '/dashboard/admin/csv-upload', icon: Upload, label: 'Upload Payment CSV' },
  { to: '/dashboard/admin/events', icon: Calendar, label: 'Events' },
  { to: '/dashboard/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/dashboard/admin/settings', icon: Settings, label: 'System Settings' },
];

const coordinatorNavItems = [
  { to: '/dashboard/coordinator', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/dashboard/coordinator/events', icon: Calendar, label: 'My Events' },
  { to: '/dashboard/coordinator/attendance', icon: CheckSquare, label: 'Attendance' },
  { to: '/dashboard/coordinator/registrations', icon: ClipboardList, label: 'All Registrations' },
  { to: '/dashboard/coordinator/payments', icon: CreditCard, label: 'Payments' },
];

// ── Role badge colors ───────────────────────────────────────────────────────

const roleLabel = (role?: string | null) => {
  if (isAdminRole(role)) return { text: 'ADMIN', color: '#E01B22' };
  if (isRegistrationDeskRole(role)) return { text: 'REGISTRATION DESK', color: '#E08A17' };
  if (isCoordinatorRole(role)) return { text: 'COORDINATOR', color: '#E08A17' };
  if (String(role || '').toLowerCase() === 'alumni') return { text: 'ALUMNI', color: '#E08A17' };
  return { text: 'PARTICIPANT', color: '#1FA971' };
};

// ── Component ───────────────────────────────────────────────────────────────

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, resetAuth } = useAuthStore();

  const isAdmin = isAdminRole(user?.role);
  const isDesk = isRegistrationDeskRole(user?.role);
  const isCoord = isCoordinatorRole(user?.role);

  // Determine which nav set to show
  const rawNavItems = isAdmin || isDesk
    ? adminNavItems
    : isCoord
    ? coordinatorNavItems
    : participantNavItems;

  const { data: settingsData } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await api.settings.get();
      return res.data;
    },
    staleTime: 60000,
  });

  const showWinners = settingsData?.show_winners === 'true';

  const navItems = rawNavItems.filter((item: any) => {
    if (item.to === '/dashboard/winners' && !showWinners) return false;
    return true;
  });

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const res = await api.notifications.getUnreadCount();
      return res.data;
    },
    refetchInterval: 30000,
    enabled: !isAdmin && !isDesk && !isCoord, // only participants get notification badge
  });
  const unreadCount = unreadData?.count || 0;

  const handleLogout = async () => {
    try { await api.auth.logout(); } catch {}
    resetAuth();
    navigate('/login');
  };

  const badge = roleLabel(user?.role);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-[2px] text-xs font-mono transition-all ${
      isActive
        ? 'bg-[#E01B22]/15 text-[#E01B22] border-l-2 border-[#E01B22]'
        : 'text-[#A79798] hover:text-[#F7F2F2] hover:bg-[#1A1114]'
    }`;

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#2A1A1D]">
        <h1 className="text-xl font-display font-bold text-[#E01B22] tracking-widest">LOGIN 2K26</h1>
        <div className="h-px bg-[#2A1A1D] my-2" />
        <p className="text-[10px] font-mono text-[#A79798] uppercase tracking-widest">
          {isAdmin || isDesk ? 'ADMIN PANEL' : isCoord ? 'COORDINATOR PANEL' : 'PARTICIPANT PANEL'}
        </p>
      </div>

      {/* Profile Header */}
      <div className="p-5 border-b border-[#2A1A1D]">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm text-[#F7F2F2] shrink-0 mt-0.5 border"
            style={{ background: `${badge.color}22`, borderColor: badge.color }}
          >
            {isAdmin ? (
              <Shield className="w-5 h-5" style={{ color: badge.color }} />
            ) : (
              (user?.name ? user.name.charAt(0).toUpperCase() : 'U')
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-display font-bold text-[#F7F2F2] truncate leading-tight">
              {user?.name}
            </p>
            <span
              className="inline-block text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm mt-1"
              style={{ color: badge.color, background: `${badge.color}22` }}
            >
              {badge.text}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] font-mono text-[#E01B22]">ID:</span>
              <span className="text-[11px] font-mono text-[#F7F2F2] font-bold">
                {user?.login_id || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end, badge: showBadge }: any) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={linkClass}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {showBadge && unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#E01B22] text-[#F7F2F2] rounded-full min-w-[18px] text-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Bottom: section label + logout */}
      <div className="p-3 border-t border-[#2A1A1D] space-y-1">
        <p className="text-[9px] font-mono text-[#3E2529] uppercase tracking-widest px-4 pb-1">
          {isAdmin || isDesk ? 'Admin Portal' : isCoord ? 'Coordinator Portal' : 'Participant Portal'}
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-[2px] text-xs font-mono text-[#A79798] hover:text-[#FF2A2A] hover:bg-[#1A1114] transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0607] flex relative">
      {/* Desktop/Tablet Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#130C0E] border-r border-[#2A1A1D] flex-col fixed top-[81px] left-0 h-[calc(100vh-81px)] z-30">
        {sidebar}
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen min-w-0 flex flex-col pb-[72px] md:pb-0">
        <div className="flex-1">
          <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full overflow-x-hidden">
            <Outlet />
          </div>
        </div>

        {/* Minimal Dashboard Footer */}
        <footer className="border-t border-[#2A1A1D] p-4 text-center mt-auto hidden md:block">
          <p className="text-[10px] font-mono text-[#6B5A5C] uppercase tracking-widest">
            LOGIN 2K26 © 2026 • SUPPORT • PRIVACY
          </p>
        </footer>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0607] border-t border-[#2A1A1D] z-50 safe-pb">
        <div className="flex items-center justify-around p-2">
          {navItems
            .filter((i: any) => ['Dashboard', 'Overview', 'Events', 'My Events', 'E-Certificates', 'My Teams', 'My Profile', 'Registrations'].includes(i.label))
            .slice(0, 5)
            .map(({ to, icon: Icon, label, end }: any) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full py-1.5 gap-1 transition-colors ${
                  isActive ? 'text-[#E01B22]' : 'text-[#6B5A5C] hover:text-[#A79798]'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-center line-clamp-1 px-1">
                {label.replace('My ', '')}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};
