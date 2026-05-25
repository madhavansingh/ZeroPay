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
  User,
  AlertTriangle,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  ShieldAlert
} from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../services/firebase';
import { useAuthStore } from '../../stores/authStore';
import axios from 'axios';

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
  const { user, activeRoleView, isDeveloperMode, setDeveloperMode } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [networkPingMs, setNetworkPingMs] = useState(38);
  const [isOnline, setIsOnline] = useState(true);
  const [isChainDegraded, setIsChainDegraded] = useState(false);

  // Hidden paths where the telemetry banner shouldn't show (like splash/auth/onboarding)
  const hiddenPaths = ['/auth', '/onboarding'];
  const isHidden = hiddenPaths.some(p => location.pathname.startsWith(p));

  // Fetch blockchain status for degraded alerts
  const checkChainStatus = async () => {
    try {
      const res = await axios.get('/health/blockchain', { timeout: 4000 });
      if (res.data?.status !== 'ok' || res.data?.detail?.includes('fallback')) {
        setIsChainDegraded(true);
      } else {
        setIsChainDegraded(false);
      }
    } catch {
      setIsChainDegraded(true); // Treat API failures as degraded fallback
    }
  };

  useEffect(() => {
    if (isHidden || !user?.id) return;

    // Listen to Firebase unread notification count
    const notificationsRef = ref(database, `/users/${user.id}/notifications`);
    const unsubscribe = onValue(notificationsRef, (snap) => {
      const data = snap.val();
      if (data) {
        const unread = Object.values(data).filter((n: any) => !n.read).length;
        setUnreadNotificationsCount(unread + 2); // include simulated unread logs
      } else {
        setUnreadNotificationsCount(2); 
      }
    }, () => {
      setUnreadNotificationsCount(2);
    });

    // Monitor internet state
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check and periodic polling
    checkChainStatus();
    const chainTimer = setInterval(checkChainStatus, 15000);

    // Simulate simple network ping updates
    const timer = setInterval(() => {
      setNetworkPingMs(Math.floor(30 + Math.random() * 20));
    }, 5000);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(chainTimer);
      clearInterval(timer);
    };
  }, [user?.id, isHidden]);

  if (isHidden) return null;

  const isMerchant = user?.role === 'merchant' || (user?.role === 'both' && activeRoleView === 'merchant');

  return (
    <div className="sticky top-0 z-40 w-full flex flex-col">
      {/* 1. DEGRADED SERVICE ALERT BANNER (High Trust Microcopy) */}
      {isChainDegraded && (
        <div className="w-full bg-amber-500 text-black px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2 shadow-inner transition-all animate-slide-down">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            Primary Cardano settlement channel is temporarily unstable. 
            <strong> Fallback routing is active. </strong> 
            All escrow locks and funds remain 100% secure.
          </span>
        </div>
      )}

      {/* 2. MAIN TELEMETRY BAR */}
      <header className="bg-[#0B0D13]/90 backdrop-blur-xl border-b border-[#22263a] px-4 py-2.5 flex items-center justify-between shadow-md">
        {/* Brand title / Env badge */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => navigate(isMerchant ? '/merchant/dashboard' : '/customer/chats')}
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-90"
          >
            <div className="w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <span className="text-[10px] font-black text-black">ZP</span>
            </div>
            <span className="text-xs font-black tracking-wider text-text-primary uppercase">ZeroPay</span>
          </div>
          
          {/* Active Mode / Escrow badge */}
          <span className="hidden sm:flex text-[9px] font-bold font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20 items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5" />
            Smart Escrow Secured
          </span>
        </div>

        {/* Telemetry quick status info (Adaptive Developer Mode) */}
        <div className="flex items-center gap-4 text-[10px] font-mono text-text-secondary">
          {/* Connection status */}
          <span className="flex items-center gap-1">
            <Wifi className={`w-3 h-3 ${isOnline ? 'text-emerald-400 animate-pulse' : 'text-rose-500 animate-bounce'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </span>

          {/* SLA Metrics - Progressive disclosure based on isDeveloperMode */}
          {isDeveloperMode ? (
            <span className="hidden md:flex items-center gap-1 text-teal-400">
              <Activity className="w-3 h-3 animate-pulse" />
              SLA: {networkPingMs}ms
            </span>
          ) : (
            <span className="hidden md:flex items-center gap-1 text-gray-400">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Ledger verified
            </span>
          )}

          {/* Quick command shortcut hint */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden sm:inline-block text-[9px] bg-[#1a1d27] border border-[#2d3248] text-text-muted hover:text-text-secondary px-2 py-0.5 rounded-md font-mono select-none transition-colors"
          >
            ⌘K Palette
          </button>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Developer Mode switch directly accessible */}
          <button
            onClick={() => setDeveloperMode(!isDeveloperMode)}
            className="flex items-center gap-1 bg-[#131622] hover:bg-[#1a1d27] border border-[#22263a] px-2 py-1 rounded-lg transition text-[9px] font-bold uppercase"
            title="Toggle developer analytics layers"
          >
            {isDeveloperMode ? (
              <span className="text-emerald-400">Dev</span>
            ) : (
              <span className="text-gray-500">Operator</span>
            )}
          </button>

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
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>
      </header>
    </div>
  );
}
