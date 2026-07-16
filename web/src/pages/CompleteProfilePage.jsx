// CompleteProfilePage — for Google users to fill remaining details
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Phone, Mail, ArrowRight } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';

const CompleteProfilePage = () => {
  const { user, completeProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    phone: '',
    role: 'TENANT',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (form.phone && !/^\d{10}$/.test(form.phone)) e.phone = 'Must be 10 digits';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await completeProfile({ phone: form.phone || undefined, role: form.role });
      toast.success('Profile completed! Welcome to Quikden.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  return (
    <>
      <Navbar />
      <style>{`
        .cp-bg {
          background-color: #f0fdfa;
          background-image:
            radial-gradient(circle at 20% 80%, rgba(13,148,136,0.04) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(13,148,136,0.04) 0%, transparent 50%);
        }
      `}</style>

      <div className="min-h-screen cp-bg flex items-center justify-center px-3 py-3 sm:py-6 relative overflow-hidden">
        {/* Waves */}
        <svg className="absolute bottom-0 right-0 w-48 h-24 opacity-[0.06] pointer-events-none" viewBox="0 0 256 128" fill="none">
          <path d="M0 64 Q64 0 128 64 T256 64 V128 H0 Z" fill="#0D9488" />
        </svg>

        <div className="w-full max-w-[380px] bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] px-4 py-4 sm:px-6 sm:py-6 relative z-10">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="w-14 h-14 mx-auto mb-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <User size={24} className="text-white" />
              )}
            </div>
            <h1 className="font-display font-bold text-lg text-surface-900">Complete your profile</h1>
            <p className="text-surface-500 text-[11px] mt-0.5">
              Hi {user?.name || 'there'}! Just a couple more details.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-2.5">
            {/* Email (readonly) */}
            <div>
              <label className="block text-[11px] font-medium text-surface-700 mb-0.5">Email</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"><Mail size={13} /></span>
                <input type="email" value={user?.email || ''} readOnly
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border text-[13px] bg-surface-100 text-surface-500 border-surface-200 cursor-not-allowed" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="cp-phone" className="block text-[11px] font-medium text-surface-700 mb-0.5">Phone Number (optional)</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"><Phone size={13} /></span>
                <input id="cp-phone" name="phone" type="tel" value={form.phone} onChange={handleChange}
                  placeholder="e.g. 9876543210" inputMode="numeric" maxLength={10}
                  className={`w-full pl-8 pr-2.5 py-1.5 rounded-lg border text-[13px] bg-surface-50/50 text-surface-900 placeholder:text-surface-400 transition-all focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${errors.phone ? 'border-red-400' : 'border-surface-200'}`} />
              </div>
              {errors.phone && <p className="text-[10px] text-red-500 mt-0.5">{errors.phone}</p>}
            </div>

            {/* Role toggle */}
            <div>
              <label className="block text-[11px] font-medium text-surface-700 mb-0.5">I want to use Quikden as a:</label>
              <div className="grid grid-cols-2 gap-1 bg-surface-100 p-0.5 rounded-lg">
                {[
                  { value: 'TENANT', label: 'Tenant', icon: User },
                  { value: 'OWNER', label: 'Owner', icon: Mail },
                ].map(({ value, label, icon: Icon }) => (
                  <button key={value} type="button" onClick={() => setForm((p) => ({ ...p, role: value }))}
                    className={`flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold rounded-md transition-all ${
                      form.role === value ? 'bg-white text-primary-600 shadow-sm' : 'text-surface-500 hover:text-surface-700'
                    }`}>
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-3">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Continue <ArrowRight size={14} /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default CompleteProfilePage;
