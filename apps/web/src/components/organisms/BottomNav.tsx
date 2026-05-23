import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, ScanLine, LayoutDashboard, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  id: string;
}

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const isMerchant = user?.role === 'merchant' || user?.role === 'both';

  const merchantItems: NavItem[] = [
    {
      to: '/merchant/dashboard',
      icon: <LayoutDashboard size={22} />,
      label: 'Dashboard',
      id: 'nav-dashboard',
    },
    {
      to: '/merchant/checkout',
      icon: <ScanLine size={22} />,
      label: 'Checkout',
      id: 'nav-checkout',
    },
    {
      to: '/customer/chats',
      icon: <MessageSquare size={22} />,
      label: 'Chats',
      id: 'nav-chats',
    },
    {
      to: '/profile',
      icon: <User size={22} />,
      label: 'Profile',
      id: 'nav-profile',
    },
  ];

  const customerItems: NavItem[] = [
    {
      to: '/customer/chats',
      icon: <MessageSquare size={22} />,
      label: 'Chats',
      id: 'nav-chats',
    },
    {
      to: '/customer/scan',
      icon: <ScanLine size={22} />,
      label: 'Scan',
      id: 'nav-scan',
    },
    {
      to: '/profile',
      icon: <User size={22} />,
      label: 'Profile',
      id: 'nav-profile',
    },
  ];

  const items = isMerchant ? merchantItems : customerItems;

  // Hide nav on screens that should be full-screen
  const hiddenPaths = ['/auth', '/onboarding', '/customer/scan'];
  const isHidden = hiddenPaths.some((p) => location.pathname.startsWith(p));
  if (isHidden) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-surface-border bg-surface-card/80 backdrop-blur-xl">
      <div className="flex items-stretch h-16 max-w-lg mx-auto px-2">
        {items.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to));

          return (
            <button
              key={item.to}
              id={item.id}
              onClick={() => navigate(item.to)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl mx-1 my-2 transition-all duration-200 ${
                isActive
                  ? 'text-teal-400 bg-teal-600/10'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-elevated'
              }`}
            >
              <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
      {/* iOS safe area spacer */}
      <div className="h-safe-area-inset-bottom bg-transparent" />
    </nav>
  );
}
