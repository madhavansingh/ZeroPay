import { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import BottomNav from './components/organisms/BottomNav';

// Global Telemetry and UX controls
import TelemetryBanner from './components/organisms/TelemetryBanner';
import CommandPalette from './components/organisms/CommandPalette';
import GlobalSearch from './components/organisms/GlobalSearch';
import NotificationCenter from './components/organisms/NotificationCenter';
import SystemHealthDrawer from './components/organisms/SystemHealthDrawer';


// Auth + Onboarding (always eager — critical path)
import SplashPage from './pages/auth/SplashPage';
import PhoneAuthPage from './pages/auth/PhoneAuthPage';
import RoleSelectPage from './pages/auth/RoleSelectPage';
import ShopSetupPage from './pages/onboarding/ShopSetupPage';
import WalletConnectPage from './pages/onboarding/WalletConnectPage';

// Shared (small)
import ProfilePage from './pages/shared/ProfilePage';
import ReceiptPage from './pages/shared/ReceiptPage';
import ChatListPage from './pages/customer/ChatListPage';
import QRDisplayPage from './pages/merchant/QRDisplayPage';

// Heavy pages — code-split
const DashboardPage = lazy(() => import('./pages/merchant/DashboardPage'));
const CounterCheckoutPage = lazy(() => import('./pages/merchant/CounterCheckoutPage'));
const ChatRoomPage = lazy(() => import('./pages/customer/ChatRoomPage'));
const ScanQRPage = lazy(() => import('./pages/customer/ScanQRPage'));
const PaymentApprovalPage = lazy(() => import('./pages/customer/PaymentApprovalPage'));
const StorefrontSetupPage = lazy(() => import('./pages/merchant/StorefrontSetupPage'));
const CatalogPage = lazy(() => import('./pages/merchant/CatalogPage'));
const AnalyticsDashboardPage = lazy(() => import('./pages/merchant/AnalyticsDashboardPage'));
const ApiKeysPage = lazy(() => import('./pages/developer/ApiKeysPage'));
const WebhooksPage = lazy(() => import('./pages/developer/WebhooksPage'));
const StorefrontPage = lazy(() => import('./pages/public/StorefrontPage'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <SplashPage />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function RequireMerchant({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <SplashPage />;
  if (!user || (user.role !== 'merchant' && user.role !== 'both')) {
    return <Navigate to="/customer/chats" replace />;
  }
  return <>{children}</>;
}

function RequireOnboardingComplete({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <SplashPage />;
  if (user && user.onboardingStep !== 'complete') {
    if (user.onboardingStep === 'new') return <Navigate to="/auth/role" replace />;
    if (user.onboardingStep === 'role-selected') {
      if (user.role === 'merchant' || user.role === 'both') {
        return <Navigate to="/onboarding/wallet" replace />;
      }
      return <Navigate to="/customer/chats" replace />;
    }
    if (user.onboardingStep === 'wallet-complete') {
      return <Navigate to="/onboarding/shop" replace />;
    }
  }
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  // Control states for global operational surfaces
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isSystemHealthOpen, setIsSystemHealthOpen] = useState(false);

  // 1. Performance & Frontend Observability: Route transition timing tracker
  useEffect(() => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      const duration = (end - start).toFixed(1);
      const timings = JSON.parse(localStorage.getItem('zeropay_route_timings') || '[]');
      const newTiming = `${location.pathname} -> ${duration}ms`;
      localStorage.setItem('zeropay_route_timings', JSON.stringify([newTiming, ...timings].slice(0, 10)));
    };
  }, [location.pathname]);

  // 2. Global Keyboard Commands listener (Cmd+K / Ctrl+K and Cmd+J / Ctrl+J)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getHomeRoute = () => {
    if (!user) return '/auth';
    if (user.onboardingStep !== 'complete') {
      if (user.onboardingStep === 'new') return '/auth/role';
      if (user.onboardingStep === 'role-selected') {
        if (user.role === 'merchant' || user.role === 'both') {
          return '/onboarding/wallet';
        }
        return '/customer/chats';
      }
      if (user.onboardingStep === 'wallet-complete') return '/onboarding/shop';
      if (user.onboardingStep === 'shop-complete') return '/merchant/dashboard';
    }
    if (user.role === 'merchant' || user.role === 'both') return '/merchant/dashboard';
    return '/customer/chats';
  };

  if (isLoading) return <SplashPage />;

  return (
    <>
      {/* Real-time telemetry banner at the top of authenticated pages */}
      {isAuthenticated && (
        <TelemetryBanner 
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
          onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)}
          onOpenSystemHealth={() => setIsSystemHealthOpen(true)}
        />
      )}

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to={isAuthenticated ? getHomeRoute() : '/auth'} replace />} />

          {/* Auth */}
          <Route path="/auth" element={<PhoneAuthPage />} />
          <Route path="/auth/role" element={<RequireAuth><RoleSelectPage /></RequireAuth>} />

          {/* Onboarding */}
          <Route path="/onboarding/shop" element={<RequireAuth><RequireMerchant><ShopSetupPage /></RequireMerchant></RequireAuth>} />
          <Route path="/onboarding/wallet" element={<RequireAuth><RequireMerchant><WalletConnectPage /></RequireMerchant></RequireAuth>} />

          {/* Merchant (heavy) */}
          <Route path="/merchant/dashboard" element={<RequireAuth><RequireOnboardingComplete><RequireMerchant><DashboardPage /></RequireMerchant></RequireOnboardingComplete></RequireAuth>} />
          <Route path="/merchant/checkout" element={<RequireAuth><RequireOnboardingComplete><RequireMerchant><CounterCheckoutPage /></RequireMerchant></RequireOnboardingComplete></RequireAuth>} />
          <Route path="/merchant/qr/:merchantId" element={<RequireAuth><RequireOnboardingComplete><RequireMerchant><QRDisplayPage /></RequireMerchant></RequireOnboardingComplete></RequireAuth>} />
          <Route path="/merchant/storefront" element={<RequireAuth><RequireOnboardingComplete><RequireMerchant><StorefrontSetupPage /></RequireMerchant></RequireOnboardingComplete></RequireAuth>} />
          <Route path="/merchant/catalog" element={<RequireAuth><RequireOnboardingComplete><RequireMerchant><CatalogPage /></RequireMerchant></RequireOnboardingComplete></RequireAuth>} />
          <Route path="/merchant/analytics" element={<RequireAuth><RequireOnboardingComplete><RequireMerchant><AnalyticsDashboardPage /></RequireMerchant></RequireOnboardingComplete></RequireAuth>} />

          {/* Developer */}
          <Route path="/developer/keys" element={<RequireAuth><RequireOnboardingComplete><RequireMerchant><ApiKeysPage /></RequireMerchant></RequireOnboardingComplete></RequireAuth>} />
          <Route path="/developer/webhooks" element={<RequireAuth><RequireOnboardingComplete><RequireMerchant><WebhooksPage /></RequireMerchant></RequireOnboardingComplete></RequireAuth>} />

          {/* Public Storefront */}
          <Route path="/s/:slug" element={<StorefrontPage />} />

          {/* Customer */}
          <Route path="/customer/chats" element={<RequireAuth><RequireOnboardingComplete><ChatListPage /></RequireOnboardingComplete></RequireAuth>} />
          <Route path="/customer/chats/:roomId" element={<RequireAuth><RequireOnboardingComplete><ChatRoomPage /></RequireOnboardingComplete></RequireAuth>} />
          <Route path="/customer/scan" element={<RequireAuth><RequireOnboardingComplete><ScanQRPage /></RequireOnboardingComplete></RequireAuth>} />
          <Route path="/customer/pay/:merchantId" element={<RequireAuth><RequireOnboardingComplete><PaymentApprovalPage /></RequireOnboardingComplete></RequireAuth>} />

          {/* Shared */}
          <Route path="/profile" element={<RequireAuth><RequireOnboardingComplete><ProfilePage /></RequireOnboardingComplete></RequireAuth>} />
          <Route path="/receipt/:invoiceId" element={<RequireAuth><RequireOnboardingComplete><ReceiptPage /></RequireOnboardingComplete></RequireAuth>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Global bottom nav */}
      {isAuthenticated && <BottomNav />}

      {/* Overlays & Drawers */}
      {isAuthenticated && (
        <>
          <CommandPalette 
            isOpen={isCommandPaletteOpen} 
            onClose={() => setIsCommandPaletteOpen(false)} 
          />
          <GlobalSearch 
            isOpen={isGlobalSearchOpen} 
            onClose={() => setIsGlobalSearchOpen(false)} 
          />
          <NotificationCenter 
            isOpen={isNotificationCenterOpen} 
            onClose={() => setIsNotificationCenterOpen(false)} 
          />
          <SystemHealthDrawer 
            isOpen={isSystemHealthOpen} 
            onClose={() => setIsSystemHealthOpen(false)} 
          />
        </>
      )}
    </>
  );
}
