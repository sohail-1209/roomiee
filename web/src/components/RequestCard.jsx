// RequestCard — reused in both Owner Dashboard and Tenant Dashboard
import { formatRent, timeAgo, requestStatusClass } from '../utils/helpers';
import { MapPin, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { requestsAPI } from '../services/endpoints';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const RequestCard = ({ request, userRole }) => {
  const qc = useQueryClient();
  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: (status) => requestsAPI.update(request.id, status),
    onSuccess: (_, status) => {
      toast.success(status === 'ACCEPTED' ? '✅ Request accepted!' : '❌ Request rejected');
      qc.invalidateQueries({ queryKey: ['requests'] });
    },
    onError: () => toast.error('Failed to update request'),
  });

  const photo = request.listing?.photos?.[0]?.url;

  return (
    <div className="card p-4 flex gap-4 animate-slide-up">
      {/* Listing thumbnail */}
      <Link to={`/listing/${request.listing?.id}`} className="flex-shrink-0">
        <img
          src={photo || 'https://placehold.co/80x80?text=No+Photo'}
          alt={request.listing?.title}
          className="w-20 h-20 rounded-xl object-cover"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link to={`/listing/${request.listing?.id}`} className="font-semibold text-surface-900 text-sm hover:text-primary-600 transition-colors line-clamp-1">
              {request.listing?.title}
            </Link>
            <div className="flex items-center gap-1 text-xs text-surface-400 mt-0.5">
              <MapPin size={11} /> {request.listing?.city}
              <span className="mx-1">·</span>
              <span className="font-medium text-surface-700">{formatRent(request.listing?.rent)}/mo</span>
            </div>
          </div>
          <span className={`badge flex-shrink-0 text-xs ${requestStatusClass(request.status)}`}>
            {request.status}
          </span>
        </div>

        {/* Requester info (for owner view) */}
        {userRole === 'OWNER' && (
          <div className="flex items-center gap-2 mt-2">
            <img
              src={request.tenant?.profileImage || `https://ui-avatars.com/api/?name=${request.tenant?.name}&background=6366f1&color=fff`}
              alt={request.tenant?.name}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-xs text-surface-600">{request.tenant?.name}</span>
          </div>
        )}

        {request.message && (
          <p className="text-xs text-surface-500 mt-1.5 line-clamp-2 italic">"{request.message}"</p>
        )}

        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs text-surface-400 flex items-center gap-1">
            <Calendar size={11} /> {timeAgo(request.createdAt)}
          </span>

          {/* Owner action buttons */}
          {userRole === 'OWNER' && request.status === 'PENDING' && (
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => updateStatus('REJECTED')}
                disabled={isPending}
                className="btn btn-sm px-3 py-1 border border-danger-300 text-danger-500 hover:bg-danger-50 rounded-lg text-xs"
              >
                Reject
              </button>
              <button
                onClick={() => updateStatus('ACCEPTED')}
                disabled={isPending}
                className="btn-primary btn-sm px-3 py-1 text-xs rounded-lg"
              >
                Accept
              </button>
            </div>
          )}

          {/* Tenant: go to chat if accepted */}
          {userRole === 'TENANT' && request.status === 'ACCEPTED' && request.chat?.id && (
            <Link to={`/chat/${request.chat.id}`} className="ml-auto btn-primary btn-sm px-3 py-1 text-xs rounded-lg">
              Open Chat
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestCard;
