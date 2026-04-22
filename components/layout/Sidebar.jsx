import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  DollarSign,
  Award,
  FileText,
  GraduationCap,
  Calendar,
  BarChart3,
  MessageCircle,
  LogOut,
  Music
} from 'lucide-react';
import { APP_NAME } from '../../lib/constants';
import Avatar from '../ui/Avatar';

const adminNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { to: '/fees', icon: DollarSign, label: 'Fees' },
  { to: '/teachers', icon: GraduationCap, label: 'Teachers' },
  { to: '/trinity', icon: Award, label: 'Trinity Exams' },
  { to: '/assessments', icon: FileText, label: 'Assessments' },
  { to: '/events', icon: Calendar, label: 'Events' },
  { to: '/whatsapp', icon: MessageCircle, label: 'WhatsApp' },
  { to: '/reports', icon: BarChart3, label: 'Reports' }
];

const teacherNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students', icon: Users, label: 'My Students' },
  { to: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { to: '/assessments', icon: FileText, label: 'Assessments' }
];

function Sidebar() {
  const { isAdmin, profile, signOut } = useAuth();
  const location = useLocation();

  const navItems = isAdmin() ? adminNavItems : teacherNavItems;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-background-card border-r border-border hidden lg:flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center">
          <Music className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary">{APP_NAME}</h1>
          <p className="text-xs text-text-muted">School Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to ||
              (item.to !== '/' && location.pathname.startsWith(item.to));

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-brand-600/10 text-brand-400 border border-brand-500/20'
                      : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isActive && 'text-brand-400')} />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            src={profile?.photo_url}
            name={profile?.name || 'User'}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {profile?.name || 'User'}
            </p>
            <p className="text-xs text-text-muted capitalize">
              {profile?.role || 'Teacher'}
            </p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
