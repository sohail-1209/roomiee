// ChatWindow — real-time chat via Socket.io
// Used in both the Chat page and as an overlay
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Check, CheckCheck, CheckCircle, XCircle, AlertCircle, Phone } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { chatAPI, requestsAPI } from '../../services/endpoints';
import { timeAgo } from '../../utils/helpers';
import toast from 'react-hot-toast';

const Message = ({ msg, isOwn }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 animate-fade-in`}>
    {!isOwn && (
      <img
        src={msg.sender?.profileImage || `https://ui-avatars.com/api/?name=${msg.sender?.name}&background=6366f1&color=fff`}
        alt={msg.sender?.name}
        className="w-7 h-7 rounded-full mr-2 self-end flex-shrink-0 object-cover"
      />
    )}
    <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
      {msg.imageUrl && (
        <img src={msg.imageUrl} alt="attachment" className="rounded-xl max-w-full mb-1 cursor-pointer" />
      )}
      {msg.content && (
        <div className={`px-4 py-2.5 rounded-2xl text-sm ${
          isOwn
            ? 'bg-primary-600 text-white rounded-br-md'
            : 'bg-surface-100 text-surface-900 rounded-bl-md'
        }`}>
          {msg.content}
        </div>
      )}
      <div className="flex items-center gap-1 mt-1 px-1">
        <span className="text-xs text-surface-400">{timeAgo(msg.createdAt)}</span>
        {isOwn && (msg.seen ? <CheckCheck size={12} className="text-primary-400" /> : <Check size={12} className="text-surface-400" />)}
      </div>
    </div>
  </div>
);

const TypingIndicator = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex gap-1">
        {[0,1,2].map((i) => (
          <div key={i} className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <span className="text-xs text-surface-400">{t('typing')}</span>
    </div>
  );
};

const BookingRequestBanner = ({ request, onAccept, onReject, processing }) => {
  const { t } = useTranslation();
  const isPending = request?.status === 'PENDING';
  const isAccepted = request?.status === 'ACCEPTED';
  const isRejected = request?.status === 'REJECTED';

  if (isAccepted) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-success-50 border-b border-success-200">
        <CheckCircle size={18} className="text-success-600 flex-shrink-0" />
        <p className="text-sm font-medium text-success-700">{t('bookingConfirmed')}</p>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-danger-50 border-b border-danger-200">
        <XCircle size={18} className="text-danger-600 flex-shrink-0" />
        <p className="text-sm font-medium text-danger-700">{t('requestDeclined')}</p>
      </div>
    );
  }

  if (!isPending) return null;

  return (
    <div className="px-4 py-3 border-b border-surface-100 bg-surface-50">
      <div className="flex items-start gap-3">
        <AlertCircle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-surface-900">{t('rentalRequest')}</p>
          {request?.message && (
            <p className="text-sm text-surface-600 mt-1 line-clamp-2">{request.message}</p>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={onAccept}
              disabled={processing}
              className="px-4 py-2 bg-success-600 text-white text-sm font-medium rounded-lg hover:bg-success-700 transition-colors disabled:opacity-50"
            >
              {t('accept')}
            </button>
            <button
              onClick={onReject}
              disabled={processing}
              className="px-4 py-2 bg-white text-surface-700 text-sm font-medium rounded-lg border border-surface-200 hover:bg-surface-50 transition-colors disabled:opacity-50"
            >
              {t('reject')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatWindow = ({ chatId, chat, otherUser, request: initialRequest, hideHeader = false }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(initialRequest);
  const [processing, setProcessing] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  const isOwner = chat && user && chat.ownerId === user.id;
  const isRequestRejected = request?.status === 'REJECTED';

  const [otherUserStatus, setOtherUserStatus] = useState({
    isOnline: otherUser?.isOnline || false,
    lastSeen: otherUser?.lastSeen || null,
  });

  useEffect(() => {
    if (otherUser) {
      setOtherUserStatus({
        isOnline: otherUser.isOnline || false,
        lastSeen: otherUser.lastSeen || null,
      });
    }
  }, [otherUser]);

  // Load message history
  useEffect(() => {
    if (!chatId) return;
    chatAPI.getMessages(chatId)
      .then(({ data }) => setMessages(data.data))
      .finally(() => setLoading(false));
  }, [chatId]);

  // Socket: join room + listen for new messages
  useEffect(() => {
    if (!socket || !chatId) return;
    socket.emit('join_chat', chatId);
    socket.emit('mark_seen', { chatId });

    socket.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.senderId !== user?.id) socket.emit('mark_seen', { chatId });
    });
    socket.on('user_typing', ({ isTyping: t }) => setIsTyping(t));
    socket.on('messages_seen', () => {
      setMessages((prev) => prev.map((m) => ({ ...m, seen: true })));
    });
    socket.on('user_status_changed', ({ userId, isOnline, lastSeen }) => {
      if (userId === otherUser?.id) {
        setOtherUserStatus({
          isOnline,
          lastSeen: lastSeen || new Date().toISOString(),
        });
      }
    });

    return () => {
      socket.emit('leave_chat', chatId);
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('messages_seen');
      socket.off('user_status_changed');
    };
  }, [socket, chatId, user?.id, otherUser?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleTyping = useCallback(() => {
    socket?.emit('typing', { chatId, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit('typing', { chatId, isTyping: false });
    }, 1500);
  }, [socket, chatId]);

  const sendMessage = useCallback(async () => {
    const content = input.trim();
    if (!content || sending || isRequestRejected) return;
    setSending(true);
    setInput('');

    // Optimistic: add message immediately
    const tempMsg = {
      id: `temp-${Date.now()}`,
      content,
      senderId: user?.id,
      sender: { id: user?.id, name: user?.name, profileImage: user?.profileImage },
      createdAt: new Date().toISOString(),
      seen: false,
      imageUrl: null,
    };
    setMessages((prev) => [...prev, tempMsg]);

    // Try socket first, fallback to REST API
    if (socket?.connected) {
      socket.emit('send_message', { chatId, content }, (res) => {
        if (res?.error) {
          // Socket returned error — try REST fallback
          sendViaRest(chatId, content, tempMsg);
        } else if (res?.data) {
          setMessages((prev) => prev.map((m) => m.id === tempMsg.id ? { ...res.data, sender: m.sender } : m));
          setSending(false);
        } else {
          setSending(false);
        }
      });
    } else {
      // Socket not connected — use REST API directly
      sendViaRest(chatId, content, tempMsg);
    }
  }, [input, sending, socket, chatId, isRequestRejected, t, user]);

  const sendViaRest = async (chatId, content, tempMsg) => {
    try {
      const { data } = await chatAPI.sendMessage(chatId, { content });
      const realMsg = data?.data;
      if (realMsg) {
        setMessages((prev) => prev.map((m) => m.id === tempMsg.id ? { ...realMsg, sender: m.sender } : m));
      }
    } catch {
      toast.error(t('failedToSend'));
      setInput(content);
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleAccept = async () => {
    if (!request?.id) return;
    setProcessing(true);
    try {
      await requestsAPI.update(request.id, 'ACCEPTED');
      setRequest((prev) => ({ ...prev, status: 'ACCEPTED' }));
      toast.success(t('requestAccepted'));
    } catch {
      toast.error(t('failedToUpdate'));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!request?.id) return;
    setProcessing(true);
    try {
      await requestsAPI.update(request.id, 'REJECTED');
      setRequest((prev) => ({ ...prev, status: 'REJECTED' }));
      toast.success(t('requestRejected'));
    } catch {
      toast.error(t('failedToUpdate'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <svg viewBox="0 0 64 64" fill="none" className="w-12 h-12">
          <rect x="16" y="30" width="32" height="24" rx="3" fill="#e2e8f0" stroke="#0d9488" strokeWidth="2">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
          </rect>
          <path d="M12 32 L32 14 L52 32" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <animate attributeName="stroke-dasharray" values="0,100;60,40;0,100" dur="2.5s" repeatCount="indefinite" />
          </path>
        </svg>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" />
          <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
          <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-surface-100">
      {/* Header — hidden on mobile when parent provides its own */}
      {!hideHeader && (
      <div className="hidden md:flex items-center gap-3 px-5 py-4 border-b border-surface-100 bg-white">
        <img
          src={otherUser?.profileImage || `https://ui-avatars.com/api/?name=${otherUser?.name}&background=6366f1&color=fff`}
          alt={otherUser?.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="font-semibold text-surface-900">{otherUser?.name}</p>
          {otherUserStatus.isOnline ? (
            <p className="text-xs text-success-600 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
              {t('online') || 'Online'}
            </p>
          ) : (
            <p className="text-xs text-surface-450">
              {otherUserStatus.lastSeen 
                ? `${t('lastSeen') || 'Last seen'} ${timeAgo(otherUserStatus.lastSeen)}`
                : t('offline') || 'Offline'}
            </p>
          )}
        </div>
        {request?.status === 'ACCEPTED' && otherUser?.phone && (
          <a
            href={`tel:${otherUser.phone}`}
            className="p-2.5 hover:bg-surface-100 rounded-xl transition-colors text-primary-600"
            aria-label="Call"
          >
            <Phone size={18} />
          </a>
        )}
      </div>
      )}

      {/* Booking request banner — only for owner when request exists */}
      {isOwner && request && (
        <BookingRequestBanner
          request={request}
          onAccept={handleAccept}
          onReject={handleReject}
          processing={processing}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {messages.length === 0 && !isRequestRejected && (
          <p className="text-center text-surface-400 text-sm mt-10">{t('sendFirst')}</p>
        )}
        {isRequestRejected && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-surface-400">
            <XCircle size={40} className="mb-3 text-surface-300" />
            <p className="text-sm font-medium text-surface-600">{t('requestDeclined')}</p>
            <p className="text-xs text-surface-400 mt-1">{t('messagingDisabled')}</p>
          </div>
        )}
        {messages.map((msg) => (
          <Message key={msg.id} msg={msg} isOwn={msg.senderId === user?.id} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input — extra bottom padding on mobile to clear Xiayoki FAB */}
      <div className="px-4 py-3 pb-20 sm:pb-3 border-t border-surface-100 bg-surface-50">
        {isRequestRejected ? (
          <p className="text-center text-xs text-surface-400">{t('messagingDisabled')}</p>
        ) : (
        <div className="flex items-center gap-2 bg-white rounded-xl border border-surface-200 px-3 py-2">
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder={t('typeMessage')}
            rows={1}
            className="flex-1 resize-none text-sm text-surface-900 placeholder-surface-400 outline-none bg-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
