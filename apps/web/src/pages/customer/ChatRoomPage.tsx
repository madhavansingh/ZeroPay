import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader } from 'lucide-react';
import { database } from '../../services/firebase';
import { ref, onValue, push, set, DataSnapshot } from 'firebase/database';
import { useAuthStore } from '../../stores/authStore';
import PaymentRequestBubble from '../../components/organisms/PaymentRequestBubble';
import ReceiptBubble from '../../components/organisms/ReceiptBubble';
import InvoiceSheet from '../../components/organisms/InvoiceSheet';

interface ChatMessage {
  key: string;
  senderId: string;
  type: 'text' | 'payment-request' | 'payment-submitted' | 'receipt' | 'system';
  text?: string;
  payload?: Record<string, unknown>;
  timestamp: number;
}

export default function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopName, setShopName] = useState('');
  const [text, setText] = useState('');
  const [roomData, setRoomData] = useState<any>(null);
  const [showInvoiceSheet, setShowInvoiceSheet] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId) return;

    // Load room metadata
    const roomMetaRef = ref(database, `/chatrooms/${roomId}`);
    onValue(roomMetaRef, (snap: DataSnapshot) => {
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
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || !roomId || !user) return;
    const msgRef = push(ref(database, `/chatrooms/${roomId}/messages`));
    await set(msgRef, {
      senderId: user.id,
      type: 'text',
      text: text.trim(),
      timestamp: Date.now(),
    });
    setText('');

    // Update lastMessage
    await set(ref(database, `/chatrooms/${roomId}/lastMessage`), {
      preview: text.trim().slice(0, 50),
      timestamp: Date.now(),
    });
  };

  return (
    <div className="h-screen bg-surface flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-surface-border bg-surface-card">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-elevated transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 rounded-2xl bg-teal-600/10 flex items-center justify-center">
          <span className="text-teal-400 font-bold">{shopName?.charAt(0)?.toUpperCase() ?? '?'}</span>
        </div>
        <div>
          <p className="font-semibold">{shopName || 'Chat'}</p>
          <p className="text-text-muted text-xs">ZeroPay merchant</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center pt-10">
            <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-text-muted text-sm pt-10">
            No messages yet. The merchant will send you a payment request.
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === user?.id;

            if (msg.type === 'payment-request' && msg.payload) {
              return (
                <PaymentRequestBubble
                  key={msg.key}
                  payload={msg.payload as {
                    invoiceId: string;
                    merchantId: string;
                    shopName: string;
                    amountPaise: number;
                    amountLovelace: number;
                    adaInrRate: number;
                    description?: string;
                    expiresAt: string;
                  }}
                />
              );
            }

            if (msg.type === 'payment-submitted' && msg.payload) {
              const payload = msg.payload as {
                invoiceId: string;
                txHash: string;
                amountPaise: number;
                amountLovelace: number;
                submittedAt: string;
              };

              return (
                <div key={msg.key} className="flex justify-center my-2 animate-fade-in">
                  <div className="bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs px-4 py-2.5 rounded-3xl flex flex-col items-center gap-1.5 font-medium w-full max-w-[240px] text-center">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                      </span>
                      <Loader size={12} className="animate-spin text-teal-400" />
                      <span className="uppercase tracking-wider font-semibold text-[10px]">
                        Payment Submitted
                      </span>
                    </div>
                    <p className="text-text-primary text-sm font-semibold mt-0.5">
                      ₹{(payload.amountPaise / 100).toFixed(2)}
                    </p>
                    <p className="text-text-muted text-[10px] font-mono">
                      {(payload.amountLovelace / 1_000_000).toFixed(4)} ADA · confirming
                    </p>
                  </div>
                </div>
              );
            }

            if (msg.type === 'receipt' && msg.payload) {
              return (
                <ReceiptBubble
                  key={msg.key}
                  payload={msg.payload as {
                    invoiceId: string;
                    txHash: string;
                    amountPaise: number;
                    amountLovelace: number;
                    receiptCid: string;
                    ipfsUrl: string;
                    settledAt: string;
                  }}
                />
              );
            }

            if (msg.type === 'text') {
              return (
                <div key={msg.key} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMine
                        ? 'bg-teal-600 text-white rounded-br-sm'
                        : 'bg-surface-card border border-surface-border text-text-primary rounded-bl-sm'
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-8 pt-2 border-t border-surface-border bg-surface">
        <div className="flex gap-2">
          {(user?.role === 'merchant' || user?.role === 'both') && (
            <button
              id="chat-request-payment-btn"
              onClick={() => setShowInvoiceSheet(true)}
              className="px-4 py-3 bg-teal-600/10 hover:bg-teal-600/20 text-teal-400 font-medium rounded-2xl transition-all active:scale-95 shrink-0 flex items-center justify-center border border-teal-500/20 animate-fade-in"
            >
              Request ₹
            </button>
          )}
          <input
            type="text"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="input flex-1"
          />
          <button
            id="send-message-btn"
            onClick={sendMessage}
            disabled={!text.trim()}
            className="btn-primary px-5 py-3 shrink-0"
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

