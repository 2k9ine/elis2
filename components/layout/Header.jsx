import { useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Menu, Bell } from 'lucide-react';
import { useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

// Page titles based on route
const pageTitles = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/attendance': 'Attendance',
  '/fees': 'Fees & Billing',
  '/teachers': 'Teachers',
  '/trinity': 'Trinity Exams',
  '/assessments': 'Assessments',
  '/events': 'Events & Recitals',
  '/whatsapp': 'WhatsApp',
  '/reports': 'Reports',
  '/login': 'Sign In'
};

function getPageTitle(pathname) {
  // Check for exact match first
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  // Check for parent routes
  for (const [route, title] of Object.entries(pageTitles)) {
    if (route !== '/' && pathname.startsWith(route)) {
      return title;
    }
  }

  return 'Eli\'s Learning';
}

function Header({ onMenuClick }) {
  const location = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const title = getPageTitle(location.pathname);

  return (
    <>
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 lg:px-8 py-4">
          {/* Left side - Title & Mobile Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-2 text-text-muted hover:text-text-primary"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
          </div>

          {/* Right side - Notifications */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full" />
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Modal */}
      <Modal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Notifications"
        size="sm"
      >
        <div className="space-y-3">
          {[
            { id: 1, message: 'New student enrollment: Sarah Johnson', time: '5 min ago', type: 'info' },
            { id: 2, message: 'Fee payment received from Ahmed Family', time: '1 hour ago', type: 'success' },
            { id: 3, message: 'Trinity exam application pending approval', time: '2 hours ago', type: 'warning' }
          ].map((notification) => (
            <div
              key={notification.id}
              className="p-3 rounded-lg bg-white/5 border border-border hover:bg-white/10 transition-colors cursor-pointer"
            >
              <p className="text-sm text-text-primary">{notification.message}</p>
              <p className="text-xs text-text-muted mt-1">{notification.time}</p>
            </div>
          ))}

          <div className="pt-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setNotificationsOpen(false)}
            >
              Mark all as read
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default Header;
