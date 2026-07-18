// ReviewCard — used in Listing Detail and Profile
import { Star } from 'lucide-react';
import { timeAgo } from '../utils/helpers';

const ReviewCard = ({ review }) => (
  <div className="card p-4 flex gap-4 animate-fade-in">
    <img
      src={review.reviewer?.profileImage ||
        `https://ui-avatars.com/api/?name=${review.reviewer?.name}&background=6366f1&color=fff`}
      alt={review.reviewer?.name}
      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
    />
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <p className="font-semibold text-sm text-surface-900">{review.reviewer?.name}</p>
        <span className="text-xs text-surface-400">{timeAgo(review.createdAt)}</span>
      </div>
      {/* Stars */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map((s) => (
            <Star
              key={s}
              size={13}
              className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-surface-200'}
            />
          ))}
        </div>
        <span className="text-xs font-semibold text-surface-650">({review.rating}/5)</span>
      </div>
      {review.comment && <p className="text-sm text-surface-600 leading-relaxed">{review.comment}</p>}
    </div>
  </div>
);

export default ReviewCard;
