import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Plus, Trash2, Clipboard, Check, Eye, EyeOff, Loader2, ArrowLeft, ShieldAlert } from 'lucide-react';
import { getApiKeys, createApiKey, revokeApiKey } from '../../services/api';

export default function ApiKeysPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: keysData, isLoading } = useQuery({
    queryKey: ['developer-keys'],
    queryFn: () => getApiKeys(),
  });

  const activeKeys = keysData?.data || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [permissions, setPermissions] = useState<string[]>(['*']);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const generateMutation = useMutation({
    mutationFn: () => createApiKey({ name: newKeyName, permissions }),
    onSuccess: (res) => {
      setRevealedKey(res.data?.apiKey || null);
      queryClient.invalidateQueries({ queryKey: ['developer-keys'] });
      setNewKeyName('');
      setPermissions(['*']);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to generate API Key');
      setTimeout(() => setError(''), 5000);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (keyId: string) => revokeApiKey(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developer-keys'] });
    },
  });

  const handleCopy = () => {
    if (revealedKey) {
      navigator.clipboard.writeText(revealedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const togglePermission = (perm: string) => {
    if (perm === '*') {
      setPermissions(['*']);
      return;
    }
    const current = permissions.filter((p) => p !== '*');
    if (current.includes(perm)) {
      const next = current.filter((p) => p !== perm);
      setPermissions(next.length === 0 ? ['*'] : next);
    } else {
      setPermissions([...current, perm]);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-28 text-text-primary">
      {/* Header */}
      <div className="px-5 pt-14 pb-5 flex items-center justify-between border-b border-surface-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/merchant/dashboard')} className="btn-ghost p-1">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Developer API Keys</h1>
            <p className="text-xs text-text-secondary">Credentials for integrating ZeroPay Escrow</p>
          </div>
        </div>
        <button
          onClick={() => {
            setRevealedKey(null);
            setModalOpen(true);
          }}
          className="btn-primary flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs"
        >
          <Plus size={16} /> Generate Key
        </button>
      </div>

      {/* Main List */}
      <div className="px-5 mt-6 max-w-xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="text-teal-500 animate-spin" />
          </div>
        ) : activeKeys.length === 0 ? (
          <div className="card text-center py-12 space-y-3">
            <Key size={36} className="text-text-muted mx-auto" />
            <h3 className="text-sm font-semibold">No API Keys Generated</h3>
            <p className="text-xs text-text-secondary">
              Generate credentials to connect your e-commerce storefront or back-office systems.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="btn-ghost text-xs text-teal-400 font-semibold mt-2"
            >
              Generate your first key
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeKeys.map((key: any) => (
              <div key={key.keyId} className="card relative hover:border-teal-500/25 transition-all">
                <div className="pr-12 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary">{key.name}</span>
                    <span className="badge bg-teal-600/10 text-teal-400 font-mono text-[9px]">
                      {key.rateLimitTier || 'starter'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-text-secondary font-mono bg-surface-elevated/40 border border-surface-border py-1 px-2.5 rounded-lg inline-block">
                      {key.keyId}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      Requests: <span className="text-text-secondary">{key.requestCount || 0}</span> · Last Used:{' '}
                      <span className="text-text-secondary">
                        {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'never'}
                      </span>
                    </p>
                  </div>
                  {/* Permissions Chips */}
                  <div className="flex gap-1.5 flex-wrap">
                    {key.permissions.map((p: string) => (
                      <span key={p} className="text-[9px] font-mono bg-surface-border text-text-secondary px-2 py-0.5 rounded-md">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Revoke action */}
                <button
                  onClick={() => revokeMutation.mutate(key.keyId)}
                  disabled={revokeMutation.isPending}
                  className="absolute right-4 top-4 p-2 rounded-xl btn-ghost hover:bg-red-950/20 text-status-failed"
                  title="Revoke Key"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creation / Plaintext Reveal Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-surface-card rounded-3xl border border-surface-border p-6 space-y-5 shadow-2xl relative animate-slide-up">
            {revealedKey ? (
              // ── Plaintext Reveal Mode ──────────────────────────────────────
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-indigo-500/20 pb-3">
                  <ShieldAlert size={20} className="text-indigo-400 animate-bounce" />
                  <h2 className="text-base font-bold text-indigo-300">Copy Your Plaintext API Key</h2>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  For secure storage reasons, we can <span className="text-text-primary font-bold">NEVER show this key again</span>. Paste it into your secure env parameters now.
                </p>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={revealedKey}
                    className="input font-mono text-xs pr-12 bg-surface-elevated border-indigo-500/20 text-indigo-300"
                  />
                  <button
                    onClick={handleCopy}
                    className="absolute right-3 top-1/2 -translate-y-1/2 btn-ghost p-1 rounded-lg bg-surface-elevated/80 border border-surface-border hover:bg-surface-border text-teal-400"
                  >
                    {copied ? <Check size={16} className="text-status-confirmed" /> : <Clipboard size={16} />}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setRevealedKey(null);
                    setModalOpen(false);
                  }}
                  className="btn-primary w-full py-2.5 rounded-xl text-xs font-semibold"
                >
                  I've Saved This Key Safely
                </button>
              </div>
            ) : (
              // ── Key Config Mode ────────────────────────────────────────────
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                  <h2 className="text-sm font-bold text-text-primary">Generate Developer API Key</h2>
                  <button onClick={() => setModalOpen(false)} className="btn-ghost p-1">
                    <Check size={18} className="rotate-45" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newKeyName.trim()) return;
                    generateMutation.mutate();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs text-text-secondary block mb-1">Key Label Name</label>
                    <input
                      type="text"
                      required
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g. WooCommerce main connection"
                      className="input text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-text-secondary block mb-1">Assigned Permissions</label>
                    <div className="space-y-2">
                      {[
                        { perm: '*', desc: 'Full Root Access (*)' },
                        { perm: 'escrow:read', desc: 'Read invoice & escrow state' },
                        { perm: 'escrow:write', desc: 'Lock & trigger release escrow' },
                        { perm: 'webhooks:write', desc: 'Register webhook subscriptions' },
                      ].map((item) => (
                        <label
                          key={item.perm}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-elevated/40 border border-surface-border cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={permissions.includes(item.perm)}
                            onChange={() => togglePermission(item.perm)}
                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-surface-elevated border-surface-border"
                          />
                          <div>
                            <span className="text-xs font-bold font-mono text-text-primary block">
                              {item.perm}
                            </span>
                            <span className="text-[10px] text-text-secondary">{item.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {error && <p className="text-xs text-status-failed text-center font-semibold">{error}</p>}

                  <button
                    type="submit"
                    disabled={generateMutation.isPending || !newKeyName.trim()}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {generateMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                    Generate Plaintext Key
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
