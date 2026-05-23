import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Clock } from 'lucide-react';
import { database } from '../../services/firebase';
import { ref, onValue } from 'firebase/database';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';

interface ChatRoom {
  roomId: string;
  merchantId: string;
  shopName: string;
  lastMessage?: { preview: string; timestamp: number };
  unreadCount?: number;
}

export default function ChatListPage() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.id) return;
    const roomsRef = ref(database, `/users/${user.id}/chatrooms`);
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const rooms: ChatRoom[] = Object.values(data);
        // Sort by last message timestamp
        rooms.sort((a, b) => (b.lastMessage?.timestamp ?? 0) - (a.lastMessage?.timestamp ?? 0));
        setChatRooms(rooms);
      } else {
        setChatRooms([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.id]);

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60_000) return 'just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-text-secondary text-sm mt-0.5">Pay merchants via chat</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : chatRooms.length === 0 ? (
        <div className="px-5 text-center py-16">
          <div className="w-16 h-16 rounded-full bg-surface-card flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={28} className="text-text-muted" />
          </div>
          <p className="font-medium text-text-secondary">No chats yet</p>
          <p className="text-text-muted text-sm mt-1">Scan a merchant's QR to start paying</p>
          <button
            id="scan-qr-btn"
            onClick={() => navigate('/customer/scan')}
            className="btn-primary mt-6 px-8"
          >
            Scan QR Code
          </button>
        </div>
      ) : (
        <div className="px-5 space-y-2">
          {chatRooms.map((room) => (
            <button
              key={room.roomId}
              id={`chat-room-${room.roomId}`}
              onClick={() => navigate(`/customer/chats/${room.roomId}`)}
              className="w-full card flex items-center gap-4 text-left hover:border-teal-600/30 transition-all active:scale-[0.98]"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-2xl bg-teal-600/10 flex items-center justify-center shrink-0">
                <span className="text-teal-400 font-bold text-lg">
                  {room.shopName?.charAt(0)?.toUpperCase() ?? '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold truncate">{room.shopName}</p>
                  {room.lastMessage && (
                    <span className="text-text-muted text-xs ml-2 shrink-0">
                      {formatTime(room.lastMessage.timestamp)}
                    </span>
                  )}
                </div>
                <p className="text-text-secondary text-sm truncate mt-0.5">
                  {room.lastMessage?.preview ?? 'Start chatting'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* FAB - Scan QR */}
      {chatRooms.length > 0 && (
        <button
          id="fab-scan-qr"
          onClick={() => navigate('/customer/scan')}
          className="fixed bottom-24 right-6 btn-primary flex items-center gap-2 shadow-2xl shadow-teal-600/30"
        >
          + New Payment
        </button>
      )}
    </div>
  );
}
