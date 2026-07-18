// UserReviewsModal — displays reviews and average rating for a specific user
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { reviewsAPI } from '../services/endpoints';
import { Modal } from './ui';
import ReviewCard from './ReviewCard';

const UserReviewsModal = ({ isOpen, onClose, userId, userName }) => {
  const { t } = useTranslation();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', userId],
    queryFn: () => reviewsAPI.getUserReviews(userId).then((r) => r.data.data),
    enabled: !!userId && isOpen,
  });

  const avgRating = reviews?.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length)
    : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('userReviewsTitle', { name: userName }) || `Reviews for ${userName}`} size="md">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !reviews || reviews.length === 0 ? (
        <p className="text-center text-surface-500 py-8">{t('noReviewsYet')}</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-4 border-b border-surface-100">
            <div className="flex items-center gap-1 text-amber-500 font-semibold text-lg">
              <Star className="fill-amber-400 text-amber-400" size={20} />
              {avgRating.toFixed(1)}
            </div>
            <span className="text-sm text-surface-550">
              ({t('reviewsCount', { count: reviews.length }) || `${reviews.length} reviews`})
            </span>
          </div>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default UserReviewsModal;
