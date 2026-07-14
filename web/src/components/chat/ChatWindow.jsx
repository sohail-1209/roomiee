// ChatWindow — real-time chat via Socket.io
// Used in both the Chat page and as an overlay
import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Image as ImageIcon, Check, CheckCheck } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { chatAPI } from '../../services/endpoints';
import { timeAgo } from '../../utils/helpers';

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

const TypingIndicator = () => (
  <div className="flex items-center gap-2 px-4 py-2">
    <div className="flex gap-1">
      {[0,1,2].map((i) => (
        <div key={i} className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
    <span className="text-xs text-surface-400">typing…</span>
  </div>
);

const ChatWindow = ({ chatId, otherUser }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

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

    return () => {
      socket.emit('leave_chat', chatId);
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('messages_seen');
    };
  }, [socket, chatId, user?.id]);

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
    if (!content || sending) return;
    setSending(true);
    setInput('');
    socket?.emit('send_message', { chatId, content }, () => {});
    setSending(false);
  }, [input, sending, socket, chatId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-surface-100">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100 bg-white">
        <img
          src={otherUser?.profileImage || `https://ui-avatars.com/api/?name=${otherUser?.name}&background=6366f1&color=fff`}
          alt={otherUser?.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-surface-900">{otherUser?.name}</p>
          <p className="text-xs text-success-500">● Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {messages.length === 0 && (
          <p className="text-center text-surface-400 text-sm mt-10">Send the first message 👋</p>
        )}
        {messages.map((msg) => (
          <Message key={msg.id} msg={msg} isOwn={msg.senderId === user?.id} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-surface-100 bg-surface-50">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-surface-200 px-3 py-2">
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
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
      </div>
    </div>
  );
};

export default ChatWindow;
