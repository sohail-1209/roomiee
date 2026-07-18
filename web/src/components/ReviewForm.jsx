// ReviewForm — modal form for submitting reviews on any listing
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { reviewsAPI } from '../services/endpoints';
import { Modal, Button } from './ui';
import StarRating from './ui/StarRating';

const ReviewForm = ({ isOpen, onClose, receiverId, listingId, listingTitle }) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const qc = useQueryClient();

  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: () => reviewsAPI.create({ receiverId, listingId, rating, comment: comment.trim() || undefined }),
    onSuccess: () => {
      toast.success(t('reviewSubmitted'));
      qc.invalidateQueries({ queryKey: ['listing', listingId] });
      qc.invalidateQueries({ queryKey: ['reviews', receiverId] });
      setRating(0);
      setComment('');
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.message || t('failedToSubmitReview')),
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error(t('selectRating'));
      return;
    }
    submitReview();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('writeReviewTitle')} size="sm">
      <div className="space-y-5">
        {listingTitle && (
          <p className="text-sm text-surface-500">
            {t('reviewingOwnerOf')} <span className="font-medium text-surface-700">"{listingTitle}"</span>
          </p>
        )}

        <div className="text-center">
          <p className="text-sm font-medium text-surface-600 mb-2">{t('yourRating')}</p>
          <StarRating value={rating} onChange={setRating} size={32} className="justify-center" />
          {rating > 0 && (
            <p className="text-sm font-semibold text-primary-650 mt-1.5">
              {rating === 1 && t('ratingPoor', '1 - Poor')}
              {rating === 2 && t('ratingFair', '2 - Fair')}
              {rating === 3 && t('ratingAverage', '3 - Average')}
              {rating === 4 && t('ratingGood', '4 - Good')}
              {rating === 5 && t('ratingExcellent', '5 - Excellent')}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">{t('commentOptional')}</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('shareExperience')}
            rows={4}
            className="input resize-none"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" size="md" className="flex-1" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button variant="primary" size="md" className="flex-1" loading={isPending} onClick={handleSubmit}>
            {t('submitReview')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReviewForm;
