import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Radio, Plus, Trash2, ShieldAlert, Check, X, ArrowLeft, Loader2, Play, Activity } from 'lucide-react';
import { getWebhooks, registerWebhook, deleteWebhook, testWebhook, getWebhookDeliveries } from '../../services/api';

export default function WebhooksPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: webhooksData, isLoading } = useQuery({
    queryKey: ['developer-webhooks'],
    queryFn: () => getWebhooks(),
  });

  const webhooks = webhooksData?.data || [];

  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [activeWebhookId, setActiveWebhookId] = useState<string | null>(null);

  // Form states
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['escrow.locked', 'escrow.released']);
  const [error, setError] = useState('');

  const registerMutation = useMutation({
    mutationFn: () => registerWebhook({ url, events }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developer-webhooks'] });
      setRegisterModalOpen(false);
      setUrl('');
      setEvents(['escrow.locked', 'escrow.released']);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to register Webhook endpoint');
      setTimeout(() => setError(''), 5000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developer-webhooks'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => testWebhook(id),
    onSuccess: () => {
      alert('Mock event successfully dispatched to worker queue!');
    },
  });

  const { data: deliveriesData, isFetching: isDeliveriesFetching } = useQuery({
    queryKey: ['webhook-deliveries', activeWebhookId],
    queryFn: () => getWebhookDeliveries(activeWebhookId!),
    enabled: !!activeWebhookId && logDrawerOpen,
    refetchInterval: 10_000,
  });

  const deliveries = deliveriesData?.data || [];

  const toggleEvent = (ev: string) => {
    if (events.includes(ev)) {
      setEvents(events.filter((e) => e !== ev));
    } else {
      setEvents([...events, ev]);
    }
  };

  const handleOpenDeliveries = (id: string) => {
    setActiveWebhookId(id);
    setLogDrawerOpen(true);
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
            <h1 className="text-xl font-bold">Webhook Subscriptions</h1>
            <p className="text-xs text-text-secondary">Register callback URLs for realtime web events</p>
          </div>
        </div>
        <button
          onClick={() => setRegisterModalOpen(true)}
          className="btn-primary flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs"
        >
          <Plus size={16} /> Register Endpoint
        </button>
      </div>

      {/* Main List */}
      <div className="px-5 mt-6 max-w-xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="text-teal-500 animate-spin" />
          </div>
        ) : webhooks.length === 0 ? (
          <div className="card text-center py-12 space-y-3">
            <Radio size={36} className="text-text-muted mx-auto animate-pulse" />
            <h3 className="text-sm font-semibold">No Webhooks Registered</h3>
            <p className="text-xs text-text-secondary">
              Realtime webhooks enable server-to-server notifications upon escrow locked, settlement or disputes.
            </p>
            <button
              onClick={() => setRegisterModalOpen(true)}
              className="btn-ghost text-xs text-teal-400 font-semibold mt-2"
            >
              Register your first callback URL
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map((sub: any) => (
              <div key={sub._id} className="card relative hover:border-teal-500/25 transition-all">
                <div className="pr-12 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${sub.isActive ? 'bg-status-confirmed' : 'bg-status-failed animate-pulse'}`} />
                    <span className="text-xs font-semibold text-text-primary break-all pr-8">
                      {sub.url}
                    </span>
                  </div>

                  <div className="flex gap-1.5 flex-wrap">
                    {sub.events.map((ev: string) => (
                      <span key={ev} className="text-[9px] font-mono bg-surface-elevated text-text-secondary px-2 py-0.5 border border-surface-border rounded-md">
                        {ev}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-text-muted">
                    <span>
                      Failures: <span className={`${sub.failureCount > 0 ? 'text-status-failed font-bold' : 'text-text-secondary'}`}>
                        {sub.failureCount || 0} / 10
                      </span>
                    </span>
                    <span>
                      Last delivery:{' '}
                      <span className="text-text-secondary">
                        {sub.lastDeliveredAt ? new Date(sub.lastDeliveredAt).toLocaleTimeString() : 'never'}
                      </span>
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-surface-border/40">
                    <button
                      onClick={() => handleOpenDeliveries(sub._id)}
                      className="text-[10px] font-bold text-teal-400 btn-ghost py-1 px-3 bg-surface-elevated rounded-lg flex items-center gap-1 border border-surface-border"
                    >
                      <Activity size={10} /> View Delivery Logs
                    </button>
                    <button
                      onClick={() => testMutation.mutate(sub._id)}
                      className="text-[10px] font-bold text-indigo-400 btn-ghost py-1 px-3 bg-surface-elevated rounded-lg flex items-center gap-1 border border-surface-border"
                    >
                      <Play size={10} /> Fire Test Event
                    </button>
                  </div>
                </div>

                {/* Revoke action */}
                <button
                  onClick={() => deleteMutation.mutate(sub._id)}
                  disabled={deleteMutation.isPending}
                  className="absolute right-4 top-4 p-2 rounded-xl btn-ghost hover:bg-red-950/20 text-status-failed"
                  title="Remove Webhook"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-surface-card rounded-3xl border border-surface-border p-6 space-y-5 shadow-2xl relative animate-slide-up">
            <div className="flex justify-between items-center pb-2 border-b border-surface-border">
              <h2 className="text-sm font-bold text-text-primary">Register Webhook Endpoint</h2>
              <button onClick={() => setRegisterModalOpen(false)} className="btn-ghost p-1">
                <X size={18} className="text-text-secondary" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!url.trim()) return;
                registerMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-text-secondary block mb-1">Payload URL</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://yourserver.com/webhooks/zeropay"
                  className="input text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary block mb-1">Triggering Events</label>
                <div className="space-y-2">
                  {[
                    { ev: 'escrow.locked', desc: 'Triggered when customer locks funds' },
                    { ev: 'escrow.released', desc: 'Triggered on progressive/final milestones' },
                    { ev: 'escrow.disputed', desc: 'Triggered when dispute is raised' },
                    { ev: 'escrow.resolved', desc: 'Triggered upon settlement resolution' },
                  ].map((item) => (
                    <label
                      key={item.ev}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-elevated/40 border border-surface-border cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={events.includes(item.ev)}
                        onChange={() => toggleEvent(item.ev)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-surface-elevated border-surface-border"
                      />
                      <div>
                        <span className="text-xs font-bold font-mono text-text-primary block">
                          {item.ev}
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
                disabled={registerMutation.isPending || !url.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {registerMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                Add Webhook Endpoint
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Log Drawer */}
      {logDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface-card border-l border-surface-border h-full overflow-y-auto p-6 space-y-5 animate-slide-up flex flex-col justify-between">
            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-teal-400" />
                  <h2 className="text-sm font-bold text-text-primary">Webhook Delivery Log</h2>
                </div>
                <button onClick={() => setLogDrawerOpen(false)} className="btn-ghost p-1">
                  <X size={18} className="text-text-secondary" />
                </button>
              </div>

              {isDeliveriesFetching && deliveries.length === 0 ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={24} className="text-teal-500 animate-spin" />
                </div>
              ) : deliveries.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-12">No delivery attempts recorded yet.</p>
              ) : (
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  {deliveries.map((d: any, i: number) => (
                    <div key={i} className="bg-surface-elevated/40 border border-surface-border p-3.5 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-text-secondary uppercase">
                          {d.event}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          d.statusCode >= 200 && d.statusCode < 300
                            ? 'bg-status-confirmed/10 text-status-confirmed border border-status-confirmed/15'
                            : 'bg-status-failed/10 text-status-failed border border-status-failed/15'
                        }`}>
                          HTTP {d.statusCode || 'FAILED'}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-muted">
                        Attempt: <span className="text-text-secondary">{d.attempt || 1}</span> · Latency:{' '}
                        <span className="text-text-secondary">{d.latencyMs || 0}ms</span>
                      </p>
                      {d.responseBodyExcerpt && (
                        <pre className="text-[9px] font-mono bg-surface p-2 rounded-lg text-text-secondary overflow-x-auto select-all max-h-20">
                          {d.responseBodyExcerpt}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setLogDrawerOpen(false)} className="btn-secondary w-full py-2.5 rounded-xl text-xs font-semibold mt-4">
              Close Logs
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
