// Chat Page — shows chat list on left, active chat on right (responsive: one panel at a time on mobile)
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { chatAPI } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import { MessageCircle } from 'lucide-react';

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

  return (
    <div className="flex h-[calc(100vh-9rem)] md:h-[calc(100vh-120px)] gap-4">
      {/* Chat list — hidden on mobile when a chat is active */}
      <div className={`${chatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-shrink-0 flex-col card overflow-y-auto`}>
        <div className="p-4 border-b border-surface-100">
          <h2 className="font-display font-bold text-lg text-surface-900">Messages</h2>
        </div>
        <ChatList />
      </div>

      {/* Chat window — full width on mobile, flex-1 on desktop */}
      <div className={`${chatId ? 'flex' : 'hidden md:flex'} flex-1 min-w-0`}>
        {chatId && otherUser ? (
          <div className="w-full">
            {/* Mobile back button */}
            <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-surface-100 bg-white">
              <button
                onClick={() => navigate('/dashboard/chats')}
                className="p-2 -ml-2 hover:bg-surface-100 rounded-xl transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <img
                src={otherUser?.profileImage || `https://ui-avatars.com/api/?name=${otherUser?.name}&background=6366f1&color=fff`}
                alt={otherUser?.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <p className="font-semibold text-surface-900 text-sm">{otherUser?.name}</p>
            </div>
            <div className="h-[calc(100vh-14rem)] md:h-full">
              <ChatWindow chatId={chatId} otherUser={otherUser} hideHeader />
            </div>
          </div>
        ) : (
          <div className="card h-full flex flex-col items-center justify-center text-surface-400 w-full">
            <MessageCircle size={48} className="mb-3 text-surface-200" />
            <p className="font-semibold text-surface-600">Select a conversation</p>
            <p className="text-sm mt-1">Choose from your messages on the left</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
