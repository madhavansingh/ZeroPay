import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import BottomNav from './components/organisms/BottomNav';

// Auth
import SplashPage from './pages/auth/SplashPage';
import PhoneAuthPage from './pages/auth/PhoneAuthPage';
import RoleSelectPage from './pages/auth/RoleSelectPage';

// Onboarding
import ShopSetupPage from './pages/onboarding/ShopSetupPage';
import WalletConnectPage from './pages/onboarding/WalletConnectPage';

// Merchant
import DashboardPage from './pages/merchant/DashboardPage';
import CounterCheckoutPage from './pages/merchant/CounterCheckoutPage';
import QRDisplayPage from './pages/merchant/QRDisplayPage';

// Customer
import ChatListPage from './pages/customer/ChatListPage';
import ChatRoomPage from './pages/customer/ChatRoomPage';
import ScanQRPage from './pages/customer/ScanQRPage';
import PaymentApprovalPage from './pages/customer/PaymentApprovalPage';

// Shared
import ProfilePage from './pages/shared/ProfilePage';
import ReceiptPage from './pages/shared/ReceiptPage';

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
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to={isAuthenticated ? getHomeRoute() : '/auth'} replace />} />

        {/* Auth */}
        <Route path="/auth" element={<PhoneAuthPage />} />
        <Route path="/auth/role" element={<RequireAuth><RoleSelectPage /></RequireAuth>} />

        {/* Onboarding */}
        <Route path="/onboarding/shop" element={<RequireAuth><ShopSetupPage /></RequireAuth>} />
        <Route path="/onboarding/wallet" element={<RequireAuth><WalletConnectPage /></RequireAuth>} />

        {/* Merchant */}
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

      {/* Global bottom nav — renders on authenticated pages only */}
      {isAuthenticated && <BottomNav />}
    </>
  );
}
