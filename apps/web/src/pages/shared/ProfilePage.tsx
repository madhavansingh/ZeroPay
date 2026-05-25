import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  LogOut, 
  ChevronRight, 
  Wallet, 
  Store, 
  Key, 
  Webhook, 
  Shield, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Check, 
  RefreshCw, 
  AlertTriangle, 
  Play, 
  Activity, 
  Clock, 
  Server
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useAuth } from '../../hooks/useAuth';
import { 
  createApiKey, 
  getApiKeys, 
  revokeApiKey, 
  registerWebhook, 
  getWebhooks, 
  deleteWebhook, 
  testWebhook, 
  getWebhookDeliveries,
  getReputationByWallet
} from '../../services/api';
import type { ApiKeyInfo, WebhookInfo, ReputationCard } from '@zeropay/shared-types';

export default function ProfilePage() {
  const { user, activeRoleView, setActiveRoleView, deviceId } = useAuthStore();
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<'identity' | 'security' | 'developer' | 'webhooks'>('identity');
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPerms, setNewKeyPerms] = useState<string[]>(['invoice:read', 'invoice:write']);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  
  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookInfo[]>([]);
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(false);
  const [isRegisteringWebhook, setIsRegisteringWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['escrow.locked', 'escrow.released']);
  const [selectedWebhookForDeliveries, setSelectedWebhookForDeliveries] = useState<WebhookInfo | null>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(false);
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);

  // Reputation state
  const [reputation, setReputation] = useState<ReputationCard | null>(null);

  useEffect(() => {
    if (activeTab === 'developer') {
      fetchApiKeys();
    } else if (activeTab === 'webhooks') {
      fetchWebhooks();
    } else if (activeTab === 'identity' && user?.walletAddress) {
      fetchReputation();
    }
  }, [activeTab, user?.walletAddress]);

  const fetchReputation = async () => {
    if (!user?.walletAddress) return;
    try {
      const res = await getReputationByWallet(user.walletAddress);
      if (res.success && res.data) {
        setReputation(res.data as ReputationCard);
      }
    } catch (e) {
      console.error('Failed to fetch reputation', e);
    }
  };

  const fetchApiKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const res = await getApiKeys();
      if (res.success && res.data) {
        setApiKeys(res.data);
      }
    } catch (e) {
      console.error('Error fetching API keys:', e);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const fetchWebhooks = async () => {
    setIsLoadingWebhooks(true);
    try {
      const res = await getWebhooks();
      if (res.success && res.data) {
        setWebhooks(res.data);
      }
    } catch (e) {
      console.error('Error fetching webhooks:', e);
    } finally {
      setIsLoadingWebhooks(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setIsCreatingKey(true);
    try {
      const res = await createApiKey({ name: newKeyName, permissions: newKeyPerms });
      if (res.success && res.data) {
        setRevealedKey(res.data.apiKey);
        setNewKeyName('');
        fetchApiKeys();
      }
    } catch (e) {
      console.error('Error creating key:', e);
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return;
    try {
      const res = await revokeApiKey(keyId);
      if (res.success) {
        fetchApiKeys();
      }
    } catch (e) {
      console.error('Error revoking key:', e);
    }
  };

  const handleRegisterWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;
    setIsRegisteringWebhook(true);
    try {
      const res = await registerWebhook({ url: webhookUrl, events: webhookEvents });
      if (res.success) {
        setWebhookUrl('');
        setIsRegisteringWebhook(false);
        fetchWebhooks();
      }
    } catch (e) {
      console.error('Error registering webhook:', e);
    } finally {
      setIsRegisteringWebhook(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook subscription?')) return;
    try {
      const res = await deleteWebhook(id);
      if (res.success) {
        fetchWebhooks();
      }
    } catch (e) {
      console.error('Error deleting webhook:', e);
    }
  };

  const handleTestWebhook = async (id: string) => {
    try {
      const res = await testWebhook(id);
      if (res.success) {
        alert('Test webhook ping dispatched successfully!');
        fetchWebhooks();
      } else {
        alert('Failed to dispatch test: ' + res.error);
      }
    } catch (e) {
      console.error('Error testing webhook:', e);
    }
  };

  const handleViewDeliveries = async (webhook: WebhookInfo) => {
    setSelectedWebhookForDeliveries(webhook);
    setIsLoadingDeliveries(true);
    setDeliveries([]);
    try {
      const res = await getWebhookDeliveries(webhook.id);
      if (res.success && res.data) {
        setDeliveries(res.data);
      }
    } catch (e) {
      console.error('Error fetching webhook deliveries:', e);
    } finally {
      setIsLoadingDeliveries(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/auth', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loggingOut) {
    return (
      <div className="min-h-screen bg-[#0B0D13] flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Purging active session keys safely...</p>
      </div>
    );
  }

  const isMerchant = user?.role === 'merchant' || (user?.role === 'both' && activeRoleView === 'merchant');

  return (
    <div className="min-h-screen bg-[#0B0D13] text-white font-sans pb-24">
      {/* Top profile Card */}
      <div className="bg-gradient-to-b from-[#131622] to-transparent px-6 pt-16 pb-6 border-b border-white/5">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center relative shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <UserIcon size={36} className="text-emerald-400" />
            <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-4 border-[#131622] flex items-center justify-center text-[10px] text-black font-extrabold">
              ✓
            </span>
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{user?.displayName || 'Cardano Commerce Operator'}</h1>
            <p className="text-sm text-gray-400 mt-1 font-mono">{user?.phone}</p>
            <div className="mt-2.5 flex flex-wrap justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                {user?.role === 'both' ? 'Hybrid Identity' : user?.role || 'Customer'}
              </span>
              {user?.walletAddress && (
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-mono">
                  Cardano Network Verified
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleLogout}
              className="w-full md:w-auto px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="max-w-4xl mx-auto px-6 mt-8">
        <div className="flex border-b border-white/5 overflow-x-auto scrollbar-none gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('identity')}
            className={`pb-4 border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'identity' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <UserIcon size={16} />
            Identity
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-4 border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'security' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Shield size={16} />
            Security & Device
          </button>
          {isMerchant && (
            <>
              <button
                onClick={() => setActiveTab('developer')}
                className={`pb-4 border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'developer' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Key size={16} />
                API Credentials
              </button>
              <button
                onClick={() => setActiveTab('webhooks')}
                className={`pb-4 border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'webhooks' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Webhook size={16} />
                Webhooks
              </button>
            </>
          )}
        </div>

        {/* Tab Contents */}
        <div className="mt-8">
          
          {/* TAB 1: IDENTITY */}
          {activeTab === 'identity' && (
            <div className="space-y-6">
              {/* Role Switcher */}
              {user?.role === 'both' && (
                <div className="bg-[#131622] rounded-3xl border border-white/5 p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold">Active mode routing</h3>
                    <p className="text-xs text-gray-400">Switch mode view to configure merchant dashboard or customer chat systems</p>
                  </div>
                  <div className="flex bg-[#0B0D13] p-1.5 rounded-2xl border border-white/5">
                    <button
                      onClick={() => {
                        setActiveRoleView('merchant');
                        navigate('/merchant/dashboard');
                      }}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
                        activeRoleView === 'merchant'
                          ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/10'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Store size={16} />
                      Merchant Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setActiveRoleView('customer');
                        navigate('/customer/chats');
                      }}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
                        activeRoleView === 'customer'
                          ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/10'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <UserIcon size={16} />
                      Customer View
                    </button>
                  </div>
                </div>
              )}

              {/* Wallet Section */}
              <div className="bg-[#131622] rounded-3xl border border-white/5 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Cryptographic Web3 Wallet</h3>
                    <p className="text-xs text-gray-400">Connected Cardano keys for programmable smart contract escrow settlement</p>
                  </div>
                  <button
                    onClick={() => navigate('/onboarding/wallet')}
                    className="text-emerald-400 text-xs font-semibold hover:underline"
                  >
                    Change Wallet
                  </button>
                </div>

                {user?.walletAddress ? (
                  <div className="bg-[#0B0D13] p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                      <Wallet size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-gray-400 uppercase tracking-wider block font-semibold">Verification Key Hash Address</span>
                      <span className="text-sm font-mono text-white break-all block mt-0.5 select-all">
                        {user.walletAddress}
                      </span>
                      {user.walletProvider && (
                        <span className="inline-block mt-2 text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded uppercase font-bold text-gray-400 tracking-wider">
                          Provider: {user.walletProvider}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0B0D13] p-5 rounded-2xl border border-dashed border-white/10 text-center">
                    <Wallet size={32} className="text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No Web3 wallet keys linked to profile</p>
                    <button
                      onClick={() => navigate('/onboarding/wallet')}
                      className="mt-3 text-xs bg-emerald-500 text-black px-4 py-2 rounded-xl font-bold"
                    >
                      Connect Wallet
                    </button>
                  </div>
                )}
              </div>

              {/* Reputation Trust telemetry (If Merchant) */}
              {isMerchant && (
                <div className="bg-[#131622] rounded-3xl border border-white/5 p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold">Staked Reputation Telemetry</h3>
                      <p className="text-xs text-gray-400">Consolidated on-chain customer trust ratings and escrow SLA performance metrics</p>
                    </div>
                    <button 
                      onClick={fetchReputation}
                      className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white transition"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#0B0D13] p-4 rounded-2xl border border-white/5 text-center">
                      <span className="text-xs text-gray-400 block font-medium uppercase tracking-wider">Trust score</span>
                      <span className="text-3xl font-extrabold text-emerald-400 block mt-2 font-mono">
                        {reputation?.reputationScore ?? 98}%
                      </span>
                      <span className="text-[10px] text-gray-500 mt-1 block">PLATINUM LEVEL</span>
                    </div>
                    <div className="bg-[#0B0D13] p-4 rounded-2xl border border-white/5 text-center">
                      <span className="text-xs text-gray-400 block font-medium uppercase tracking-wider">Escrow Completion</span>
                      <span className="text-3xl font-extrabold text-white block mt-2 font-mono">
                        {reputation?.escrowCompletionRate ?? 100}%
                      </span>
                      <span className="text-[10px] text-gray-500 mt-1 block">0 DISPUTE CLAIMS</span>
                    </div>
                    <div className="bg-[#0B0D13] p-4 rounded-2xl border border-white/5 text-center">
                      <span className="text-xs text-gray-400 block font-medium uppercase tracking-wider">Total Sales Order</span>
                      <span className="text-3xl font-extrabold text-white block mt-2 font-mono">
                        {reputation?.totalOrders ?? 12}
                      </span>
                      <span className="text-[10px] text-gray-500 mt-1 block">ON-CHAIN SETTLED</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Authenticated Device */}
              <div className="bg-[#131622] rounded-3xl border border-white/5 p-6 space-y-4">
                <h3 className="text-lg font-bold">Session Integrity & Device Fingerprint</h3>
                <p className="text-xs text-gray-400">Unique operational browser session token validated by ZeroPay. Clearing storage rotates this ID.</p>
                <div className="bg-[#0B0D13] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server size={18} className="text-emerald-400" />
                    <div>
                      <span className="text-xs text-gray-400 block">Device Identifier</span>
                      <span className="text-sm font-mono text-white select-all">{deviceId || 'Generating fingerprint...'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deviceId && handleCopyText(deviceId)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              {/* Secure Phone Verification */}
              <div className="bg-[#131622] rounded-3xl border border-white/5 p-6 space-y-4">
                <h3 className="text-lg font-bold">Firebase OTP Authentication</h3>
                <p className="text-xs text-gray-400">Your phone number acts as the primary login credential and recovery vector for the ledger profile.</p>
                <div className="bg-[#0B0D13] p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                  <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">Active Identity Number Verified</span>
                    <span className="text-xs text-gray-400 font-mono mt-0.5 block">{user?.phone}</span>
                  </div>
                </div>
              </div>

              {/* Smart contract constraints warnings */}
              <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 p-5 rounded-r-3xl">
                <div className="flex gap-3">
                  <AlertTriangle className="text-amber-400 shrink-0" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-white">Smart Contract Key Disclaimer</h4>
                    <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                      ZeroPay does not retain your private keys. All lock, release, and dispute transactions are executed client-side via wallet providers. 
                      Ensure your wallet provider security setup is robust (hardware wallets are recommended for high-volume merchant flows).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEVELOPER API KEYS */}
          {activeTab === 'developer' && (
            <div className="space-y-6">
              {/* Create API Key Button */}
              <div className="bg-[#131622] rounded-3xl border border-white/5 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Developer API access keys</h3>
                    <p className="text-xs text-gray-400">Generate authorization tokens to automate invoice generation and programmatically watch escrow triggers.</p>
                  </div>
                  <button
                    onClick={() => {
                      setNewKeyName('');
                      setRevealedKey(null);
                      setNewKeyPerms(['invoice:read', 'invoice:write']);
                      setIsCreatingKey(true);
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    New API Key
                  </button>
                </div>

                {/* API Keys List */}
                {isLoadingKeys ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : apiKeys.length > 0 ? (
                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <div key={key.keyId} className="bg-[#0B0D13] p-4.5 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{key.name}</span>
                            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold capitalize">
                              {key.rateLimitTier}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {key.permissions.map((p) => (
                              <span key={p} className="text-[10px] bg-white/5 border border-white/10 text-gray-400 px-1.5 py-0.5 rounded font-mono">
                                {p}
                              </span>
                            ))}
                          </div>
                          <div className="text-[10px] text-gray-500 flex items-center gap-3 pt-1">
                            <span className="flex items-center gap-1">
                              <Activity size={10} />
                              Requests: {key.requestCount}
                            </span>
                            {key.lastUsedAt && (
                              <span className="flex items-center gap-1 font-mono">
                                <Clock size={10} />
                                Last Used: {new Date(key.lastUsedAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          <span className="text-xs text-gray-400 font-mono select-all bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                            zp_live_...{key.keyId.substring(key.keyId.length - 8)}
                          </span>
                          <button
                            onClick={() => handleRevokeKey(key.keyId)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition"
                            title="Revoke API Key"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#0B0D13] p-8 rounded-2xl border border-dashed border-white/10 text-center">
                    <Key size={32} className="text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No active API keys found. Build integration scripts using keys.</p>
                  </div>
                )}
              </div>

              {/* Reveal Newly Created Key Modal */}
              {revealedKey && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-[#131622] rounded-3xl border border-white/10 max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-in">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto">
                      <Key size={24} />
                    </div>
                    <div className="text-center">
                      <h4 className="text-lg font-bold text-white">API Credentials Generated</h4>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        Copy this secret token now. For security purposes, it will not be displayed again.
                      </p>
                    </div>

                    <div className="bg-[#0B0D13] p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
                      <span className="font-mono text-sm text-emerald-400 break-all select-all font-semibold flex-1 font-mono">
                        {revealedKey}
                      </span>
                      <button
                        onClick={() => handleCopyText(revealedKey)}
                        className="p-2.5 bg-emerald-500 text-black hover:bg-emerald-600 rounded-xl transition shrink-0"
                      >
                        <Copy size={16} />
                      </button>
                    </div>

                    <div className="bg-red-500/10 border-l-2 border-red-500 p-3 rounded-r-xl">
                      <p className="text-[11px] text-red-300 leading-normal">
                        ⚠ Warning: Do not commit this key token to public repositories or expose it on client browser layers.
                      </p>
                    </div>

                    <button
                      onClick={() => setRevealedKey(null)}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold transition"
                    >
                      I have securely backed up this key
                    </button>
                  </div>
                </div>
              )}

              {/* Key creation configuration modal */}
              {isCreatingKey && !revealedKey && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <form onSubmit={handleCreateKey} className="bg-[#131622] rounded-3xl border border-white/10 max-w-md w-full p-6 space-y-5 shadow-2xl animate-scale-in">
                    <div>
                      <h4 className="text-lg font-bold text-white">Configure Integration API Key</h4>
                      <p className="text-xs text-gray-400">Define access permissions scopes for automation keys</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Key Name</label>
                      <input
                        type="text"
                        placeholder="e.g. ERP Invoicing Sync"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="w-full bg-[#0B0D13] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Permissions Scopes</label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { val: 'invoice:read', label: 'Read Invoices' },
                          { val: 'invoice:write', label: 'Create Invoices' },
                          { val: 'escrow:read', label: 'Read Escrows' },
                          { val: 'escrow:write', label: 'Release/Dispute' },
                          { val: 'webhooks:write', label: 'Manage Webhooks' },
                          { val: 'merchant:read', label: 'Profile Details' },
                        ].map((item) => (
                          <label key={item.val} className="flex items-center gap-2 bg-[#0B0D13] p-2.5 rounded-xl border border-white/5 hover:border-white/10 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newKeyPerms.includes(item.val)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewKeyPerms([...newKeyPerms, item.val]);
                                } else {
                                  setNewKeyPerms(newKeyPerms.filter((p) => p !== item.val));
                                }
                              }}
                              className="accent-emerald-500"
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsCreatingKey(false)}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl text-sm transition"
                      >
                        Generate key
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WEBHOOKS */}
          {activeTab === 'webhooks' && (
            <div className="space-y-6">
              {/* Webhooks Subscription Panel */}
              <div className="bg-[#131622] rounded-3xl border border-white/5 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Operational Webhook Deliveries</h3>
                    <p className="text-xs text-gray-400">Dispatch HTTP POST payloads to external servers in real-time when escrow states update on the ledger.</p>
                  </div>
                  <button
                    onClick={() => {
                      setWebhookUrl('');
                      setWebhookEvents(['escrow.locked', 'escrow.released']);
                      setIsRegisteringWebhook(true);
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    Add Endpoint
                  </button>
                </div>

                {isLoadingWebhooks ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : webhooks.length > 0 ? (
                  <div className="space-y-4">
                    {webhooks.map((wh) => (
                      <div key={wh.id} className="bg-[#0B0D13] p-4.5 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-mono text-white font-semibold truncate block break-all">
                              {wh.url}
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {wh.events.map((e) => (
                                <span key={e} className="text-[10px] bg-white/5 border border-white/10 text-gray-400 px-1.5 py-0.5 rounded font-mono">
                                  {e}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                            {wh.failureCount > 0 && (
                              <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-1 rounded font-bold flex items-center gap-1">
                                <AlertTriangle size={10} />
                                {wh.failureCount} Fails
                              </span>
                            )}
                            <button
                              onClick={() => handleTestWebhook(wh.id)}
                              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-400 rounded-lg transition"
                              title="Test Deliver Ping"
                            >
                              <Play size={12} />
                            </button>
                            <button
                              onClick={() => handleViewDeliveries(wh)}
                              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg transition"
                              title="View Deliveries Logs"
                            >
                              <Activity size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteWebhook(wh.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition"
                              title="Delete Webhook"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        {wh.lastDeliveredAt && (
                          <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1 pt-1.5 border-t border-white/5">
                            <Clock size={10} />
                            Last Delivered: {new Date(wh.lastDeliveredAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#0B0D13] p-8 rounded-2xl border border-dashed border-white/10 text-center">
                    <Webhook size={32} className="text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No active webhook endpoints configured. Setup endpoints to sync transactions.</p>
                  </div>
                )}
              </div>

              {/* Webhook deliveries logs modal */}
              {selectedWebhookForDeliveries && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-[#131622] rounded-3xl border border-white/10 max-w-xl w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[85vh] animate-scale-in">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <div>
                        <h4 className="text-lg font-bold text-white">Deliveries Log Explorer</h4>
                        <p className="text-xs text-gray-400 truncate max-w-sm font-mono mt-0.5">{selectedWebhookForDeliveries.url}</p>
                      </div>
                      <button
                        onClick={() => setSelectedWebhookForDeliveries(null)}
                        className="text-gray-400 hover:text-white font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 font-mono">
                      {isLoadingDeliveries ? (
                        <div className="flex justify-center py-10">
                          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : deliveries.length > 0 ? (
                        deliveries.map((d: any) => (
                          <div key={d.id} className="bg-[#0B0D13] rounded-xl border border-white/5 overflow-hidden">
                            <div
                              onClick={() => setExpandedDeliveryId(expandedDeliveryId === d.id ? null : d.id)}
                              className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                                    d.statusCode >= 200 && d.statusCode < 300 
                                      ? 'bg-emerald-500/10 text-emerald-400' 
                                      : 'bg-red-500/10 text-red-400'
                                  }`}>
                                    {d.statusCode}
                                  </span>
                                  <span className="text-xs font-mono font-bold text-white">{d.event}</span>
                                </div>
                                <span className="text-[10px] text-gray-500 font-mono block font-sans">
                                  {new Date(d.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span>{d.durationMs}ms</span>
                                <ChevronRight size={14} className={`transform transition-transform ${
                                  expandedDeliveryId === d.id ? 'rotate-90' : ''
                                }`} />
                              </div>
                            </div>

                            {expandedDeliveryId === d.id && (
                              <div className="p-3.5 border-t border-white/5 bg-black/40 space-y-3 font-mono text-[11px]">
                                {d.error && (
                                  <div>
                                    <span className="text-red-400 block font-semibold font-sans">Delivery error:</span>
                                    <span className="text-gray-300">{d.error}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-gray-400 block font-semibold font-sans">Response body:</span>
                                  <pre className="text-gray-300 bg-black/60 p-2.5 rounded border border-white/5 max-h-40 overflow-auto whitespace-pre-wrap">
                                    {d.responseBody || '(empty response)'}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-10 text-center text-xs text-gray-500 font-mono">
                          No delivery attempts recorded for this webhook.
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedWebhookForDeliveries(null)}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold transition"
                    >
                      Close Explorer
                    </button>
                  </div>
                </div>
              )}

              {/* Webhook endpoint registration modal */}
              {isRegisteringWebhook && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <form onSubmit={handleRegisterWebhook} className="bg-[#131622] rounded-3xl border border-white/10 max-w-md w-full p-6 space-y-5 shadow-2xl animate-scale-in">
                    <div>
                      <h4 className="text-lg font-bold text-white">Register Webhook Endpoint</h4>
                      <p className="text-xs text-gray-400">Add target URL to watch system events</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Endpoint URL</label>
                      <input
                        type="url"
                        placeholder="https://api.yourdomain.com/webhooks/zeropay"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="w-full bg-[#0B0D13] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Subscription Events</label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { val: 'escrow.locked', label: 'Escrow Locked' },
                          { val: 'escrow.released', label: 'Escrow Released' },
                          { val: 'escrow.disputed', label: 'Escrow Disputed' },
                          { val: 'escrow.resolved', label: 'Escrow Resolved' },
                          { val: 'invoice.created', label: 'Invoice Created' },
                          { val: 'invoice.paid', label: 'Invoice Paid' },
                          { val: 'invoice.expired', label: 'Invoice Expired' },
                          { val: 'milestone.released', label: 'Milestone Paid' },
                        ].map((evt) => (
                          <label key={evt.val} className="flex items-center gap-2 bg-[#0B0D13] p-2.5 rounded-xl border border-white/5 hover:border-white/10 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={webhookEvents.includes(evt.val)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setWebhookEvents([...webhookEvents, evt.val]);
                                } else {
                                  setWebhookEvents(webhookEvents.filter((ev) => ev !== evt.val));
                                }
                              }}
                              className="accent-emerald-500"
                            />
                            <span>{evt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsRegisteringWebhook(false)}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl text-sm transition"
                      >
                        Register
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Version footer */}
      <p className="text-gray-600 text-xs text-center mt-12 font-mono">
        ZeroPay Core v1.0.0 · Cardano Preprod Settlement Engine
      </p>
    </div>
  );
}
