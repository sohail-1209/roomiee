// Profile Page
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Camera, Star } from 'lucide-react';
import { usersAPI, reviewsAPI, uploadAPI } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/compressImage';
import DashboardLayout from '../components/layout/DashboardLayout';
import ReviewCard from '../components/ReviewCard';
import { Button, Input, Textarea, Avatar } from '../components/ui';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', bio: user?.bio || '' });
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
      toast.success('Profile updated!');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 500, maxHeight: 500, quality: 0.8 });
      const fd = new FormData();
      fd.append('photo', compressed);
      const { data } = await uploadAPI.profilePhoto(fd);
      updateUser({ profileImage: data.data.url });
      toast.success('Photo updated!');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="section-title">My Profile</h1>

      {/* Photo + basic info */}
      <div className="card p-6 flex items-center gap-5">
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
            <span className="text-sm font-medium">{user?.avgRating?.toFixed(1) || 'No rating yet'}</span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-surface-900">Edit Information</h3>
        <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} type="tel" />
        <Textarea label="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell owners/tenants about yourself..." rows={3} />
        <Button variant="primary" size="md" loading={isPending} onClick={() => updateProfile()}>Save Changes</Button>
      </div>

      {/* Reviews */}
      {reviews?.length > 0 && (
        <div>
          <h3 className="font-semibold text-surface-900 mb-3">Reviews ({reviews.length})</h3>
          <div className="space-y-3">
            {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
