import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Terminal, 
  Activity, 
  Bell, 
  Search, 
  Settings, 
  Layers, 
  Wifi, 
  ShieldCheck,
  User
} from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../services/firebase';
import { useAuthStore } from '../../stores/authStore';

interface TelemetryBannerProps {
  onOpenCommandPalette: () => void;
  onOpenGlobalSearch: () => void;
  onOpenNotificationCenter: () => void;
  onOpenSystemHealth: () => void;
}

export default function TelemetryBanner({
  onOpenCommandPalette,
  onOpenGlobalSearch,
  onOpenNotificationCenter,
  onOpenSystemHealth
}: TelemetryBannerProps) {
  const { user, activeRoleView } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [networkPingMs, setNetworkPingMs] = useState(38);
  const [isOnline, setIsOnline] = useState(true);

  // Hidden paths where the telemetry banner shouldn't show (like splash/auth/onboarding)
  const hiddenPaths = ['/auth', '/onboarding'];
  const isHidden = hiddenPaths.some(p => location.pathname.startsWith(p));

  useEffect(() => {
    if (isHidden || !user?.id) return;

    // Listen to Firebase unread notification count
    const notificationsRef = ref(database, `/users/${user.id}/notifications`);
    const unsubscribe = onValue(notificationsRef, (snap) => {
      const data = snap.val();
      if (data) {
        const unread = Object.values(data).filter((n: any) => !n.read).length;
        setUnreadNotificationsCount(unread + 3); // include simulated unread logs
      } else {
        setUnreadNotificationsCount(3); // simulated unread logs default
      }
    }, () => {
      setUnreadNotificationsCount(3);
    });

    // Monitor internet state
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulate simple network ping updates
    const timer = setInterval(() => {
      setNetworkPingMs(Math.floor(30 + Math.random() * 20));
    }, 5000);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, [user?.id, isHidden]);

  if (isHidden) return null;

  const isMerchant = user?.role === 'merchant' || (user?.role === 'both' && activeRoleView === 'merchant');

  return (
    <header className="sticky top-0 z-40 bg-[#0B0D13]/85 backdrop-blur-xl border-b border-[#22263a] px-4 py-2.5 flex items-center justify-between shadow-md">
      {/* Brand title / Env badge */}
      <div className="flex items-center gap-2">
        <div 
          onClick={() => navigate(isMerchant ? '/merchant/dashboard' : '/customer/chats')}
          className="flex items-center gap-1.5 cursor-pointer hover:opacity-90"
        >
          <div className="w-5 h-5 rounded-lg bg-teal-600 flex items-center justify-center shadow-md shadow-teal-500/20">
            <span className="text-[10px] font-black text-white">ZP</span>
          </div>
          <span className="text-xs font-black tracking-wider text-text-primary uppercase">ZeroPay</span>
        </div>
        
        {/* Environment Badge */}
        <span className="text-[9px] font-bold font-mono bg-[#131622] text-teal-400 px-2 py-0.5 rounded-md border border-[#22263a] flex items-center gap-1">
          <ShieldCheck className="w-2.5 h-2.5 text-teal-400" />
          Preprod-L1
        </span>
      </div>

      {/* Telemetry quick status info */}
      <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-text-secondary">
        <span className="flex items-center gap-1">
          <Wifi className={`w-3 h-3 ${isOnline ? 'text-emerald-400 animate-pulse' : 'text-rose-500'}`} />
          {isOnline ? 'Online' : 'Offline'}
        </span>
        <span className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-teal-400" />
          SLA: {networkPingMs}ms
        </span>
        <button
          onClick={onOpenCommandPalette}
          className="text-[9px] bg-[#1a1d27] border border-[#2d3248] text-text-muted hover:text-text-secondary px-2 py-0.5 rounded-md font-mono select-none transition-colors"
        >
          ⌘K Palette
        </button>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-1">
        {/* Search */}
        <button
          onClick={onOpenGlobalSearch}
          className="p-1.5 hover:bg-[#131622] border border-transparent hover:border-[#22263a] text-text-secondary hover:text-text-primary rounded-lg transition-all"
          title="Search Entity Explorer (⌘J)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* System Health panel */}
        <button
          id="system-health-toggle-btn"
          onClick={onOpenSystemHealth}
          className="p-1.5 hover:bg-[#131622] border border-transparent hover:border-[#22263a] text-text-secondary hover:text-text-primary rounded-lg transition-all"
          title="System Health & SLA"
        >
          <Activity className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Event Center notifications */}
        <button
          onClick={onOpenNotificationCenter}
          className="relative p-1.5 hover:bg-[#131622] border border-transparent hover:border-[#22263a] text-text-secondary hover:text-text-primary rounded-lg transition-all"
          title="Event Notification Center"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          )}
        </button>
      </div>
    </header>
  );
}
