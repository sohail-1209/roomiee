// ChatList — shows list of all chats for the current user
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { chatAPI } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';
import { timeAgo } from '../../utils/helpers';
import { MessageCircle } from 'lucide-react';

const ChatListItem = ({ chat, userId }) => {
  const otherUser = chat.ownerId === userId ? chat.tenant : chat.owner;
  const lastMsg = chat.messages?.[0];
  const unread = chat._count?.messages || 0;

  return (
    <Link
      to={`/chat/${chat.id}`}
      className="flex items-center gap-3 p-4 hover:bg-surface-50 rounded-xl transition-colors cursor-pointer"
    >
      <div className="relative flex-shrink-0">
        <img
          src={otherUser?.profileImage || `https://ui-avatars.com/api/?name=${otherUser?.name}&background=6366f1&color=fff`}
          alt={otherUser?.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`font-semibold text-sm truncate ${unread > 0 ? 'text-surface-900' : 'text-surface-700'}`}>
            {otherUser?.name}
          </p>
          <span className="text-xs text-surface-400 flex-shrink-0 ml-2">
            {lastMsg ? timeAgo(lastMsg.createdAt) : ''}
          </span>
        </div>
        <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'text-surface-700 font-medium' : 'text-surface-400'}`}>
          {lastMsg?.content || 'Chat unlocked — say hello!'}
        </p>
        <p className="text-xs text-primary-500 mt-0.5 truncate">{chat.listing?.title}</p>
      </div>
    </Link>
  );
};

const ChatList = () => {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: () => chatAPI.getChats().then((r) => r.data.data),
  });

  if (isLoading) return (
    <div className="space-y-2 p-4">
      {[1,2,3,4].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
    </div>
  );

  if (!data?.length) return (
    <div className="flex flex-col items-center justify-center h-64 text-surface-400">
      <MessageCircle size={40} className="mb-3 text-surface-300" />
      <p className="font-medium">No chats yet</p>
      <p className="text-sm mt-1">Chats unlock after a request is accepted</p>
    </div>
  );

  return (
    <div className="divide-y divide-surface-100">
      {data.map((chat) => <ChatListItem key={chat.id} chat={chat} userId={user?.id} />)}
    </div>
  );
};

export default ChatList;
