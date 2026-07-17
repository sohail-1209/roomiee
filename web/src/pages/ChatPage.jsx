// Chat Page — shows chat list on left, active chat on right (responsive: one panel at a time on mobile)
// When a chat is active on mobile, renders as fullscreen overlay
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { chatAPI } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import { MessageCircle, Phone, ArrowLeft } from 'lucide-react';

const ChatPage = () => {
  const { id: chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: chats } = useQuery({
    queryKey: ['chats'],
    queryFn: () => chatAPI.getChats().then((r) => r.data.data),
  });

  const activeChat = chats?.find((c) => c.id === chatId);
  const otherUser = activeChat
    ? activeChat.ownerId === user?.id
      ? activeChat.tenant
      : activeChat.owner
    : null;
  const request = activeChat?.request || null;

  // Mobile fullscreen: when a chat is active, take over the entire viewport
  if (chatId && otherUser) {
    return (
      <>
        {/* Desktop: normal two-panel layout */}
        <div className="hidden md:flex h-[calc(100vh-120px)] gap-4 max-w-5xl mx-auto">
          <div className="w-80 flex-shrink-0 flex-col card overflow-y-auto">
            <div className="p-4 border-b border-surface-100">
              <h2 className="font-display font-bold text-lg text-surface-900">Messages</h2>
            </div>
            <ChatList />
          </div>
          <div className="flex-1 min-w-0">
            <div className="w-full">
              <div className="h-full">
                <ChatWindow chatId={chatId} chat={activeChat} otherUser={otherUser} request={request} hideHeader={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: fullscreen chat */}
        <div className="md:hidden fixed inset-0 z-50 bg-white flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {/* Mobile header */}
          <div className="flex items-center gap-3 px-3 py-3 border-b border-surface-100/60 bg-white shrink-0">
            <button
              onClick={() => navigate('/dashboard/chats')}
              className="p-2 -ml-1 hover:bg-surface-100 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <img
              src={otherUser?.profileImage || `https://ui-avatars.com/api/?name=${otherUser?.name}&background=6366f1&color=fff`}
              alt={otherUser?.name}
              className="w-9 h-9 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-surface-900 text-sm truncate">{otherUser?.name}</p>
              {request?.status === 'ACCEPTED' && (
                <p className="text-xs text-success-500">Online</p>
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
          {/* Chat content fills remaining space */}
          <div className="flex-1 min-h-0">
            <ChatWindow chatId={chatId} chat={activeChat} otherUser={otherUser} request={request} hideHeader />
          </div>
        </div>
      </>
    );
  }

  // No active chat: show chat list (desktop two-panel, mobile single panel)
  return (
    <div className="flex h-[calc(100vh-11rem)] md:h-[calc(100vh-120px)] gap-4 max-w-5xl mx-auto">
      <div className="flex w-full md:w-80 flex-shrink-0 flex-col card overflow-y-auto">
        <div className="p-4 border-b border-surface-100">
          <h2 className="font-display font-bold text-lg text-surface-900">Messages</h2>
        </div>
        <ChatList />
      </div>
      <div className="hidden md:flex flex-1 min-w-0">
        <div className="card h-full flex flex-col items-center justify-center text-surface-400 w-full">
          <MessageCircle size={48} className="mb-3 text-surface-200" />
          <p className="font-semibold text-surface-600">Select a conversation</p>
          <p className="text-sm mt-1">Choose from your messages on the left</p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
