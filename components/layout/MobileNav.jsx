import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  DollarSign,
  Menu
} from 'lucide-react';
import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';

const mobileNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { to: '/fees', icon: DollarSign, label: 'Fees' }
];

function MobileNav() {
  const { isAdmin, profile, signOut } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = isAdmin()
    ? mobileNavItems
    : mobileNavItems.filter(item => item.to !== '/fees');

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background-card border-t border-border lg:hidden z-40">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to ||
              (item.to !== '/' && location.pathname.startsWith(item.to));

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'text-brand-400'
                    : 'text-text-muted'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            );
          })}

          {/* Menu Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-text-muted"
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs font-medium">Menu</span>
          </button>
        </div>
      </nav>

      {/* More Menu Modal */}
      <Modal
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Menu"
        size="sm"
      >
        <div className="space-y-4">
          {/* User Profile */}
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <Avatar
              src={profile?.photo_url}
              name={profile?.name || 'User'}
              size="lg"
            />
            <div>
              <p className="font-medium text-text-primary">{profile?.name || 'User'}</p>
              <p className="text-sm text-text-muted capitalize">
                {profile?.role || 'Teacher'}
              </p>
            </div>
          </div>

          {/* Additional Menu Items */}
          <div className="space-y-1">
            {isAdmin() && (
              <>
                <NavLink
                  to="/teachers"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-text-primary hover:bg-white/5"
                >
                  <span>Teachers</span>
                </NavLink>
                <NavLink
                  to="/trinity"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-text-primary hover:bg-white/5"
                >
                  <span>Trinity Exams</span>
                </NavLink>
                <NavLink
                  to="/events"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-text-primary hover:bg-white/5"
                >
                  <span>Events</span>
                </NavLink>
                <NavLink
                  to="/whatsapp"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-text-primary hover:bg-white/5"
                >
                  <span>WhatsApp</span>
                </NavLink>
                <NavLink
                  to="/reports"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-text-primary hover:bg-white/5"
                >
                  <span>Reports</span>
                </NavLink>
              </>
            )}

            <NavLink
              to="/assessments"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-text-primary hover:bg-white/5"
            >
              <span>Assessments</span>
            </NavLink>
          </div>

          {/* Sign Out */}
          <div className="pt-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default MobileNav;
