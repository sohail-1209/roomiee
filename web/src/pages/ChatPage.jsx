// Chat Page — shows chat list on left, active chat on right
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { chatAPI } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import { MessageCircle } from 'lucide-react';

const ChatPage = () => {
  const { id: chatId } = useParams();
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
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Chat list */}
      <div className="w-80 flex-shrink-0 card overflow-y-auto">
        <div className="p-4 border-b border-surface-100">
          <h2 className="font-display font-bold text-lg text-surface-900">Messages</h2>
        </div>
        <ChatList />
      </div>

      {/* Chat window */}
      <div className="flex-1">
        {chatId && otherUser ? (
          <ChatWindow chatId={chatId} otherUser={otherUser} />
        ) : (
          <div className="card h-full flex flex-col items-center justify-center text-surface-400">
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
