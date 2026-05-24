import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import BottomNav from './components/organisms/BottomNav';

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
  const { user } = useAuthStore();
  if (!user || (user.role !== 'merchant' && user.role !== 'both')) {
    return <Navigate to="/customer/chats" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  const getHomeRoute = () => {
    if (!user) return '/auth';
    if (user.onboardingStep !== 'complete') {
      if (user.onboardingStep === 'new') return '/auth/role';
      if (user.onboardingStep === 'role-selected') return '/onboarding/shop';
      if (user.onboardingStep === 'shop-complete') return '/onboarding/wallet';
    }
    if (user.role === 'merchant' || user.role === 'both') return '/merchant/dashboard';
    return '/customer/chats';
  };

  if (isLoading) return <SplashPage />;

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to={isAuthenticated ? getHomeRoute() : '/auth'} replace />} />

          {/* Auth */}
          <Route path="/auth" element={<PhoneAuthPage />} />
          <Route path="/auth/role" element={<RequireAuth><RoleSelectPage /></RequireAuth>} />

          {/* Onboarding */}
          <Route path="/onboarding/shop" element={<RequireAuth><ShopSetupPage /></RequireAuth>} />
          <Route path="/onboarding/wallet" element={<RequireAuth><WalletConnectPage /></RequireAuth>} />

          {/* Merchant (heavy) */}
          <Route path="/merchant/dashboard" element={<RequireAuth><RequireMerchant><DashboardPage /></RequireMerchant></RequireAuth>} />
          <Route path="/merchant/checkout" element={<RequireAuth><RequireMerchant><CounterCheckoutPage /></RequireMerchant></RequireAuth>} />
          <Route path="/merchant/qr/:merchantId" element={<RequireAuth><RequireMerchant><QRDisplayPage /></RequireMerchant></RequireAuth>} />

          {/* Customer */}
          <Route path="/customer/chats" element={<RequireAuth><ChatListPage /></RequireAuth>} />
          <Route path="/customer/chats/:roomId" element={<RequireAuth><ChatRoomPage /></RequireAuth>} />
          <Route path="/customer/scan" element={<RequireAuth><ScanQRPage /></RequireAuth>} />
          <Route path="/customer/pay/:merchantId" element={<RequireAuth><PaymentApprovalPage /></RequireAuth>} />

          {/* Shared */}
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/receipt/:invoiceId" element={<RequireAuth><ReceiptPage /></RequireAuth>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Global bottom nav */}
      {isAuthenticated && <BottomNav />}
    </>
  );
}
