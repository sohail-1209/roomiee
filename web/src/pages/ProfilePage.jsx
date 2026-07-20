// Profile Page
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Camera, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usersAPI, reviewsAPI, uploadAPI } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/compressImage';
import DashboardLayout from '../components/layout/DashboardLayout';
import ReviewCard from '../components/ReviewCard';
import { Button, Input, Textarea, Avatar, Modal } from '../components/ui';

const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', bio: user?.bio || '' });
  const [passForm, setPassForm] = useState({ newPassword: '' });
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: reviews } = useQuery({
    queryKey: ['reviews', user?.id],
    queryFn: () => reviewsAPI.getUserReviews(user?.id).then((r) => r.data.data),
    enabled: !!user?.id,
  });

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: () => usersAPI.updateProfile(form),
    onSuccess: ({ data }) => {
      updateUser(data.data);
      qc.invalidateQueries({ queryKey: ['reviews', user?.id] });
      toast.success(t('profileUpdated'));
    },
    onError: () => toast.error(t('failedToUpdateProfile')),
  });

  const { mutate: updatePassword, isPending: isPassPending } = useMutation({
    mutationFn: () => usersAPI.changePassword(passForm),
    onSuccess: () => {
      setPassForm({ newPassword: '' });
      toast.success(t('passwordUpdated') || 'Password updated successfully');
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || t('somethingWrong') || 'Something went wrong';
      toast.error(msg);
    },
  });

  const handlePassUpdateClick = () => {
    if (!passForm.newPassword) return;
    setConfirmText('');
    setShowPassConfirm(true);
  };

  const handlePhotoUpload = async (e) => {
    const original = e.target.files?.[0];
    if (!original) return;
    setUploading(true);
    try {
      const { file } = await compressImage(original, { maxWidth: 500, maxHeight: 500, quality: 0.8 });
      const fd = new FormData();
      fd.append('photo', file);
      const { data } = await uploadAPI.profilePhoto(fd);
      updateUser({ profileImage: data.data.url });
      toast.success(t('photoUpdated'));
    } catch { toast.error(t('uploadFailed')); }
    finally { setUploading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6">
      <h1 className="section-title">{t('myProfile')}</h1>

      {/* Photo + basic info */}
      <div className="card p-4 sm:p-6 flex items-center gap-4 sm:gap-5">
        <div className="relative flex-shrink-0">
          <Avatar src={user?.profileImage} name={user?.name} size="xl" />
          <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-primary-700 transition-colors">
            {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={14} />}
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>
        <div>
          <h2 className="font-display font-bold text-xl text-surface-900">{user?.name}</h2>
          <p className="text-surface-500 text-sm">{user?.email}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star size={14} className="text-accent-400 fill-accent-400" />
            <span className="text-sm font-medium">{user?.avgRating?.toFixed(1) || t('noRatingYet')}</span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="card p-4 sm:p-6 space-y-4">
        <h3 className="font-semibold text-surface-900">{t('editInformation')}</h3>
        <Input label={t('fullName')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label={t('phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} type="tel" />
        <Textarea label={t('bio')} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder={t('tellAbout')} rows={3} />
        <Button variant="primary" size="md" loading={isPending} onClick={() => updateProfile()}>{t('saveChanges')}</Button>
      </div>

      {/* Change Password form */}
      {user?.hasPassword && (
        <div className="card p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold text-surface-900">{t('changePassword') || 'Change Password'}</h3>
          <Input label={t('newPassword') || 'New Password'} value={passForm.newPassword} onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })} type="password" />
          <Button variant="primary" size="md" onClick={handlePassUpdateClick} disabled={!passForm.newPassword}>{t('updatePassword') || 'Update Password'}</Button>
        </div>
      )}

      {/* Reviews */}
      {reviews?.length > 0 && (
        <div>
          <h3 className="font-semibold text-surface-900 mb-3">{t('reviewsCount', { count: reviews.length })}</h3>
          <div className="space-y-3">
            {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        </div>
      )}

      {/* Password Confirmation Modal */}
      <Modal isOpen={showPassConfirm} onClose={() => setShowPassConfirm(false)} title={t('confirmPasswordChange') || 'Confirm Password Change'}>
        <p className="text-sm text-surface-600 mb-4">{t('typeChangeToConfirm') || 'Please type'} <strong>CHANGE</strong> {t('toConfirm') || 'to confirm.'}</p>
        <Input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="CHANGE" />
        <Button 
          variant="primary" 
          className="w-full mt-4" 
          disabled={confirmText !== 'CHANGE'}
          loading={isPassPending}
          onClick={() => {
            updatePassword();
            setShowPassConfirm(false);
          }}
        >
          {t('confirm') || 'Confirm'}
        </Button>
      </Modal>
    </div>
  );
};

export default ProfilePage;
