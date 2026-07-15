// ReviewForm — modal form for submitting reviews on any listing
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { reviewsAPI } from '../services/endpoints';
import { Modal, Button } from './ui';
import StarRating from './ui/StarRating';

const ReviewForm = ({ isOpen, onClose, receiverId, listingId, listingTitle }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const qc = useQueryClient();

  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: () => reviewsAPI.create({ receiverId, listingId, rating, comment: comment.trim() || undefined }),
    onSuccess: () => {
      toast.success('Review submitted!');
      qc.invalidateQueries({ queryKey: ['listing', listingId] });
      qc.invalidateQueries({ queryKey: ['reviews', receiverId] });
      setRating(0);
      setComment('');
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to submit review'),
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    submitReview();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Write a Review" size="sm">
      <div className="space-y-5">
        {listingTitle && (
          <p className="text-sm text-surface-500">
            Reviewing owner of <span className="font-medium text-surface-700">"{listingTitle}"</span>
          </p>
        )}

        <div className="text-center">
          <p className="text-sm font-medium text-surface-600 mb-2">Your Rating</p>
          <StarRating value={rating} onChange={setRating} size={32} className="justify-center" />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Comment (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience — how was the owner, property, location..."
            rows={4}
            className="input resize-none"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" size="md" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" className="flex-1" loading={isPending} onClick={handleSubmit}>
            Submit Review
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReviewForm;
