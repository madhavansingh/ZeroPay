import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader, Shield, Play, AlertTriangle, Check, RefreshCw, Copy } from 'lucide-react';
import { database } from '../../services/firebase';
import { ref, onValue, push, set, DataSnapshot } from 'firebase/database';
import { useAuthStore } from '../../stores/authStore';
import PaymentRequestBubble from '../../components/organisms/PaymentRequestBubble';
import ReceiptBubble from '../../components/organisms/ReceiptBubble';
import InvoiceSheet from '../../components/organisms/InvoiceSheet';
import { buildEscrowRelease, submitEscrowRelease, buildEscrowDispute, submitEscrowDispute } from '../../services/api';
import { bech32 } from 'bech32';

interface ChatMessage {
  key: string;
  senderId: string;
  type: 'text' | 'payment-request' | 'payment-submitted' | 'receipt' | 'system';
  text?: string;
  payload?: Record<string, unknown>;
  timestamp: number;
}

function bech32FromHex(hex: string): string {
  if (hex.startsWith('addr') || hex.startsWith('stake')) return hex;
  try {
    const cleanHex = hex.trim();
    const bytes = Uint8Array.from(
      cleanHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );
    const networkId = bytes[0] & 0x0f;
    const prefix = networkId === 1 ? 'addr' : 'addr_test';
    const words = bech32.toWords(bytes);
    return bech32.encode(prefix, words, 1023);
  } catch (err) {
    console.error(err);
    return hex;
  }
}

export default function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopName, setShopName] = useState('');
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(true);
  const [roomData, setRoomData] = useState<any>(null);
  const [showInvoiceSheet, setShowInvoiceSheet] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Typing states
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const typingTimeoutRef = useRef<any>(null);

  // Escrow live state mapping for inline milestones
  const [escrowStates, setEscrowStates] = useState<Record<string, {
    state: string;
    milestones: any[];
    milestoneIndex: number;
    disputed: boolean;
  }>>({});
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    // Load room metadata
    const roomMetaRef = ref(database, `/chatrooms/${roomId}`);
    const unsubscribeMeta = onValue(roomMetaRef, (snap: DataSnapshot) => {
      const data = snap.val();
      if (data) {
        setRoomData(data);
        if (data.shopName) setShopName(data.shopName);
      }
    }, { onlyOnce: true });

    // Listen to messages
    const messagesRef = ref(database, `/chatrooms/${roomId}/messages`);
    const unsubscribe = onValue(messagesRef, (snap: DataSnapshot) => {
      const data = snap.val();
      if (data) {
        const msgs: ChatMessage[] = Object.entries(data).map(([key, val]) => ({
          key,
          ...(val as Omit<ChatMessage, 'key'>),
        }));
        msgs.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(msgs);

        // Fetch live escrow state for payment request messages
        msgs.forEach(m => {
          if (m.type === 'payment-request' && m.payload?.invoiceId) {
            const invId = m.payload.invoiceId as string;
            const escrowRef = ref(database, `/escrow/${invId}`);
            onValue(escrowRef, (escrowSnap) => {
              const escData = escrowSnap.val();
              if (escData) {
                setEscrowStates(prev => ({
                  ...prev,
                  [invId]: {
                    state: escData.escrowState || 'None',
                    milestones: escData.milestones || [],
                    milestoneIndex: escData.milestoneIndex ?? 0,
                    disputed: escData.isDisputed || false
                  }
                }));
              }
            });
          }
        });
      }
      setLoading(false);
    });

    // Listen to typing status
    const typingRef = ref(database, `/chatrooms/${roomId}/typing`);
    const unsubscribeTyping = onValue(typingRef, (snap) => {
      const data = snap.val() || {};
      const typing: string[] = [];
      Object.entries(data).forEach(([uid, val]) => {
        if (val === true && uid !== user?.id) {
          typing.push(uid === 'gemini' ? 'Gemini Bargaining Agent' : 'Merchant');
        }
      });
      setTypingUsers(typing);
    });

    // Monitor connectivity
    const connectedRef = ref(database, '/.info/connected');
    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      setConnected(!!snap.val());
    });

    return () => {
      unsubscribeMeta();
      unsubscribe();
      unsubscribeConnected();
      unsubscribeTyping();
    };
  }, [roomId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleTextChange = (val: string) => {
    setText(val);
    if (!user || !roomId) return;

    if (!isTypingLocal) {
      setIsTypingLocal(true);
      set(ref(database, `/chatrooms/${roomId}/typing/${user.id}`), true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingLocal(false);
      set(ref(database, `/chatrooms/${roomId}/typing/${user.id}`), false);
    }, 2000);
  };

  const sendMessage = async () => {
    if (!text.trim() || !roomId || !user) return;
    const msgRef = push(ref(database, `/chatrooms/${roomId}/messages`));
    await set(msgRef, {
      senderId: user.id,
      type: 'text',
      text: text.trim(),
      timestamp: Date.now(),
    });
    
    // Clear typing status
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTypingLocal(false);
    await set(ref(database, `/chatrooms/${roomId}/typing/${user.id}`), false);

    setText('');

    // Update lastMessage
    await set(ref(database, `/chatrooms/${roomId}/lastMessage`), {
      preview: text.trim().slice(0, 50),
      timestamp: Date.now(),
    });
  };

  // Web3 Progressive Milestone Release
  const handleReleaseMilestone = async (invoiceId: string) => {
    const esc = escrowStates[invoiceId];
    if (!esc || !window.cardano) return;
    setSubmittingAction(`release-${invoiceId}`);

    try {
      // 1. Enable Cardano wallet
      const walletKey = localStorage.getItem('zeropay_connected_wallet') || 'lace';
      const api = await window.cardano[walletKey]!.enable();
      const usedAddresses = await api.getUsedAddresses();
      const hexAddress = usedAddresses[0] ?? (await api.getChangeAddress());
      const customerAddress = bech32FromHex(hexAddress);

      // 2. Fetch locked transaction details from local Firebase state
      const currentMilestone = esc.milestones[esc.milestoneIndex];
      if (!currentMilestone) throw new Error('No active milestones to release');

      // 3. Build release transaction via backend
      const res = await buildEscrowRelease({
        invoiceId,
        customerAddress,
        scriptUtxoTxHash: currentMilestone.scriptUtxoTxHash || 'mock-tx-hash',
        scriptUtxoIndex: currentMilestone.scriptUtxoIndex ?? 0,
        payoutLovelace: currentMilestone.amountLovelace,
      });

      if (!res.success || !res.data) throw new Error(res.error || 'Failed to build milestone release transaction');

      // 4. Sign CBOR inside sandboxed wallet
      const signedTx = await api.signTx(res.data.unsignedCbor, true);

      // 5. Submit to ledger
      const hash = await api.submitTx(signedTx);

      // 6. Notify backend
      await submitEscrowRelease(invoiceId, hash, currentMilestone.amountLovelace);
      alert(`Milestone "${currentMilestone.title}" release transaction broadcasted: ${hash}`);
    } catch (err: any) {
      alert(`Milestone release failed: ${err.message || String(err)}`);
    } finally {
      setSubmittingAction(null);
    }
  };

  // Web3 Escrow Dispute initiation
  const handleDisputeEscrow = async (invoiceId: string) => {
    const esc = escrowStates[invoiceId];
    if (!esc || !window.cardano) return;
    setSubmittingAction(`dispute-${invoiceId}`);

    try {
      const walletKey = localStorage.getItem('zeropay_connected_wallet') || 'lace';
      const api = await window.cardano[walletKey]!.enable();
      const usedAddresses = await api.getUsedAddresses();
      const hexAddress = usedAddresses[0] ?? (await api.getChangeAddress());
      const signerAddress = bech32FromHex(hexAddress);

      const currentMilestone = esc.milestones[esc.milestoneIndex];
      if (!currentMilestone) throw new Error('No active milestones to dispute');

      const res = await buildEscrowDispute({
        invoiceId,
        signerAddress,
        scriptUtxoTxHash: currentMilestone.scriptUtxoTxHash || 'mock-tx-hash',
        scriptUtxoIndex: currentMilestone.scriptUtxoIndex ?? 0,
      });

      if (!res.success || !res.data) throw new Error(res.error || 'Failed to build dispute transaction');

      const signedTx = await api.signTx(res.data.unsignedCbor, true);
      const hash = await api.submitTx(signedTx);

      await submitEscrowDispute(invoiceId, hash);
      alert(`Dispute raised on milestone "${currentMilestone.title}". Transaction hash: ${hash}`);
    } catch (err: any) {
      alert(`Dispute execution failed: ${err.message || String(err)}`);
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <div className="h-screen bg-[#0B0D13] flex flex-col text-text-primary">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-[#22263a] bg-[#131622]/60">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-elevated transition-colors text-text-secondary">
          <ArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 rounded-2xl bg-teal-600/10 flex items-center justify-center border border-teal-500/20">
          <span className="text-teal-400 font-bold">{shopName?.charAt(0)?.toUpperCase() ?? '?'}</span>
        </div>
        <div>
          <p className="font-bold text-sm">{shopName || 'Chat'}</p>
          <p className="text-text-muted text-[10px] uppercase font-mono">Real-time Session Channel</p>
        </div>
      </div>

      {/* Connectivity Banner */}
      {!connected && (
        <div className="bg-amber-600/90 text-white px-4 py-2 text-[10px] flex items-center justify-center gap-2 font-mono shrink-0">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          WS DISCONNECTED — RETRYING FIREBASE EVENT SYNC
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-indicator">
        {loading ? (
          <div className="flex justify-center pt-10">
            <Loader size={20} className="text-teal-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 space-y-2 text-text-muted text-xs">
            <Shield className="w-8 h-8 mx-auto text-[#1c1f2e]" />
            <p>Secure double-entry chat channel active.</p>
            <p className="text-[10px]">Merchant invoice generation will manifest directly in this timeline.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === user?.id;

            if (msg.type === 'payment-request' && msg.payload) {
              const invoiceId = msg.payload.invoiceId as string;
              const esc = escrowStates[invoiceId];
              const isLocked = esc?.state === 'Locked';
              const isDisputed = esc?.disputed === true;

              return (
                <div key={msg.key} className="space-y-2">
                  <PaymentRequestBubble payload={msg.payload as any} />
                  
                  {/* Web3 Inline progressive milestone action card */}
                  {esc && esc.milestones.length > 0 && (
                    <div className="flex justify-center animate-fade-in">
                      <div className="w-full max-w-xs bg-[#131622] border border-[#22263a] rounded-2xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#22263a] pb-2">
                          <span className="text-[9px] font-mono font-bold text-text-secondary uppercase">
                            Escrow Milestone Status
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                            isDisputed ? 'bg-rose-500/10 text-rose-400 border border-rose-500/15' : 'bg-teal-500/10 text-teal-400 border border-teal-500/15'
                          }`}>
                            {isDisputed ? 'DISPUTED' : esc.state}
                          </span>
                        </div>

                        {/* Milestone info */}
                        <div className="text-xs">
                          <p className="text-text-primary font-bold">
                            Active: {esc.milestones[esc.milestoneIndex]?.title || 'None'}
                          </p>
                          <p className="text-[10px] text-text-muted mt-0.5">
                            Milestone {esc.milestoneIndex + 1} of {esc.milestones.length}
                          </p>
                        </div>

                        {/* Actions for buyer */}
                        {isLocked && !isDisputed && !isMine && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              onClick={() => handleReleaseMilestone(invoiceId)}
                              disabled={submittingAction === `release-${invoiceId}`}
                              className="btn-primary py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 rounded-xl"
                            >
                              {submittingAction === `release-${invoiceId}` ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                              Release
                            </button>
                            <button
                              onClick={() => handleDisputeEscrow(invoiceId)}
                              disabled={submittingAction === `dispute-${invoiceId}`}
                              className="btn-secondary hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 rounded-xl border border-[#22263a]"
                            >
                              {submittingAction === `dispute-${invoiceId}` ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <AlertTriangle className="w-3 h-3" />
                              )}
                              Dispute
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            if (msg.type === 'payment-submitted' && msg.payload) {
              const payload = msg.payload as any;
              return (
                <div key={msg.key} className="flex justify-center my-2 animate-fade-in">
                  <div className="bg-[#131622] border border-[#22263a] text-text-secondary text-xs px-4 py-3 rounded-2xl flex flex-col items-center gap-1.5 font-medium w-full max-w-[240px] text-center shadow-lg">
                    <div className="flex items-center gap-1.5">
                      <Loader size={12} className="animate-spin text-teal-400" />
                      <span className="uppercase tracking-wider font-bold text-[9px] text-teal-400 font-mono">
                        Mempool Confirming
                      </span>
                    </div>
                    <p className="text-text-primary text-sm font-bold mt-0.5">
                      ₹{(payload.amountPaise / 100).toFixed(2)}
                    </p>
                    <p className="text-text-muted text-[10px] font-mono">
                      {(payload.amountLovelace / 1_000_000).toFixed(4)} ADA · awaiting block
                    </p>
                  </div>
                </div>
              );
            }

            if (msg.type === 'receipt' && msg.payload) {
              return (
                <ReceiptBubble
                  key={msg.key}
                  payload={msg.payload as any}
                />
              );
            }

            if (msg.type === 'text') {
              return (
                <div key={msg.key} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      isMine
                        ? 'bg-teal-600 text-white rounded-br-sm'
                        : 'bg-[#131622] border border-[#22263a] text-text-primary rounded-bl-sm shadow-md'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            }

            return null;
          })
        )}

        {/* Real-time typing indicators */}
        {typingUsers.map((name) => (
          <div key={name} className="flex justify-start items-center gap-2 animate-fade-in">
            <div className="flex gap-1 bg-[#131622] border border-[#22263a] px-3.5 py-2 rounded-2xl rounded-bl-sm">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <span className="text-[8px] font-mono text-text-muted uppercase">{name} is typing</span>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-8 pt-2 border-t border-[#22263a] bg-[#0b0d13]">
        <div className="flex gap-2">
          {(user?.role === 'merchant' || user?.role === 'both') && (
            <button
              id="chat-request-payment-btn"
              onClick={() => setShowInvoiceSheet(true)}
              className="px-4 py-3 bg-teal-600/10 hover:bg-teal-600/20 text-teal-400 font-bold rounded-2xl transition-all active:scale-95 shrink-0 flex items-center justify-center border border-teal-500/25 text-xs animate-fade-in"
            >
              Request
            </button>
          )}
          <input
            type="text"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="input flex-1 text-xs border-[#22263a] bg-[#131622]/60 focus:border-teal-600 focus:ring-teal-600 text-text-primary rounded-2xl"
          />
          <button
            id="send-message-btn"
            onClick={sendMessage}
            disabled={!text.trim()}
            className="btn-primary px-5 py-3 shrink-0 rounded-2xl text-xs font-bold uppercase tracking-wider"
          >
            Send
          </button>
        </div>
      </div>

      {showInvoiceSheet && (
        <InvoiceSheet
          onClose={() => setShowInvoiceSheet(false)}
          chatRoomId={roomId}
          customerId={roomData?.customerId}
        />
      )}
    </div>
  );
}
