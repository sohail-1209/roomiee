// SaveButton — animated heart/save toggle with auth guard.
// Uses savedAPI for mutations, shows toast feedback, redirects unauthenticated users.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { savedAPI } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';

/**
 * @param {string|number} listingId  - The listing's ID
 * @param {boolean}       isSaved    - Current saved state (controlled)
 * @param {Function}      onToggle   - Optional callback after successful toggle
 */
const SaveButton = ({ listingId, isSaved, onToggle }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [localSaved, setLocalSaved] = useState(isSaved);
  const [animating, setAnimating] = useState(false);

  // Keep local state in sync when parent prop changes
  React.useEffect(() => {
    setLocalSaved(isSaved);
  }, [isSaved]);

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: () =>
      localSaved ? savedAPI.unsave(listingId) : savedAPI.save(listingId),
    onMutate: () => {
      // Optimistic update
      setLocalSaved((prev) => !prev);
      setAnimating(true);
      setTimeout(() => setAnimating(false), 400);
    },
    onSuccess: () => {
      // Invalidate saved listings query so lists refresh
      queryClient.invalidateQueries({ queryKey: ['saved'] });
      onToggle?.(!localSaved);

      // Simple toast notification via custom event
      window.dispatchEvent(
        new CustomEvent('quikden:toast', {
          detail: {
            message: localSaved ? t('saveRemoved') : t('saved'),
            type: 'success',
          },
        })
      );
    },
    onError: () => {
      // Revert optimistic update
      setLocalSaved((prev) => !prev);
      window.dispatchEvent(
        new CustomEvent('quikden:toast', {
          detail: { message: t('somethingWrong'), type: 'error' },
        })
      );
    },
  });

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    if (!isSaving) save();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSaving}
      aria-label={localSaved ? t('removeSaved') : t('saveListingBtn')}
      className={`
        group flex items-center justify-center w-9 h-9 rounded-full
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1
        bg-white/80 backdrop-blur-sm hover:bg-white
        shadow-sm hover:shadow-md
        ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}
      `}
    >
      <Heart
        size={18}
        className={`
          transition-all duration-300
          ${animating ? 'scale-125' : 'scale-100'}
          ${localSaved
            ? 'fill-red-500 text-red-500'
            : 'fill-none text-surface-400 group-hover:text-red-400'
          }
        `}
      />
    </button>
  );
};

export default SaveButton;
