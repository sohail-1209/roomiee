// RegisterPage — clean centered card design matching login page
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Phone, ArrowRight, Eye, EyeOff, CheckCircle, Send } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';

// Google Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// ─── House Illustration SVG ──────────────────────────────────────────────────
const HouseIllustration = () => (
  <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
    <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-full" />
    <div className="absolute top-1 right-1 w-1 h-1 bg-teal-300 rounded-full opacity-60" />
    <svg className="absolute top-1 right-2 w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="6" fill="#FBBF24" />
      <circle cx="16" cy="16" r="8" fill="#FBBF24" opacity="0.2" />
    </svg>
    <svg className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-14 h-12 sm:w-16 sm:h-14" viewBox="0 0 120 100" fill="none">
      <rect x="55" y="20" width="35" height="58" rx="2" fill="#E2E8F0" />
      <rect x="60" y="26" width="8" height="8" rx="1" fill="#94A3B8" />
      <rect x="72" y="26" width="8" height="8" rx="1" fill="#94A3B8" />
      <rect x="60" y="40" width="8" height="8" rx="1" fill="#94A3B8" />
      <rect x="72" y="40" width="8" height="8" rx="1" fill="#94A3B8" />
      <path d="M50 22 L72.5 5 L95 22" fill="#0D9488" />
      <rect x="15" y="35" width="45" height="43" rx="2" fill="#F8FAFC" />
      <rect x="21" y="41" width="10" height="10" rx="1" fill="#94A3B8" />
      <rect x="37" y="41" width="10" height="10" rx="1" fill="#94A3B8" />
      <rect x="30" y="58" width="14" height="20" rx="2" fill="#0D9488" />
      <circle cx="41" cy="68" r="1.5" fill="#FBBF24" />
      <path d="M10 37 L37.5 18 L65 37" fill="#0D9488" />
      <rect x="8" y="55" width="3" height="23" rx="1" fill="#92400E" />
      <circle cx="9.5" cy="50" r="8" fill="#10B981" />
      <circle cx="9.5" cy="48" r="6" fill="#34D399" />
      <ellipse cx="75" cy="80" rx="10" ry="5" fill="#10B981" />
      <ellipse cx="85" cy="81" rx="7" ry="4" fill="#34D399" />
    </svg>
    <svg className="absolute top-2.5 left-4 w-4 h-2.5" viewBox="0 0 24 16" fill="none" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round">
      <path d="M2 8 Q6 2 12 8" />
      <path d="M12 8 Q16 2 22 8" />
    </svg>
  </div>
);

// ─── Password Input ──────────────────────────────────────────────────────────
function PasswordInput({ label, name, value, onChange, placeholder, error, id }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-medium text-surface-700 mb-0.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
          <Lock size={13} />
        </span>
        <input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={name === 'password' ? 'new-password' : 'new-password'}
          className={`w-full pl-8 pr-8 py-1.5 rounded-lg border text-[13px] bg-surface-50/50 text-surface-900 placeholder:text-surface-400 transition-all focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
            error ? 'border-red-400' : 'border-surface-200'
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          tabIndex={-1}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
        >
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
      {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const RegisterPage = () => {
  const { register, googleAuth, sendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'TENANT', terms: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'verify-email'
  const [verificationUrl, setVerificationUrl] = useState('');

  // Initialize Google Sign-In
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });
      }
    };

    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.head.appendChild(script);
    } else if (window.google?.accounts?.id) {
      initializeGoogleSignIn();
    }
  }, []);

  const handleGoogleCallback = async (response) => {
    if (!response.credential) return;
    setGoogleLoading(true);
    try {
      const result = await googleAuth(response.credential);
      if (result.needsProfile) {
        toast.success('Please complete your profile');
        navigate('/complete-profile', { replace: true });
      } else {
        toast.success('Welcome! 👋');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google signup failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast('Google signup not configured yet', { icon: '⚠️' });
      return;
    }
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      toast('Google Sign-In is loading, please try again', { icon: '⏳' });
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address';
    if (form.phone && !/^\d{10}$/.test(form.phone)) e.phone = 'Must be 10 digits';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.terms) e.terms = 'You must agree to the Terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password, role: form.role });
      // Send verification email
      const verData = await sendVerificationEmail();
      if (verData.verificationUrl) {
        setVerificationUrl(verData.verificationUrl);
      }
      setStep('verify-email');
      toast.success('Account created! Please verify your email.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  return (
    <>
      <Navbar />
      <style>{`
        .reg-bg {
          background-color: #f0fdfa;
          background-image:
            radial-gradient(circle at 20% 80%, rgba(13,148,136,0.04) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(13,148,136,0.04) 0%, transparent 50%);
        }
        .reg-dots { background-image: radial-gradient(circle, rgba(13,148,136,0.15) 1px, transparent 1px); background-size: 16px 16px; }
      `}</style>

      <div className="min-h-screen reg-bg flex items-center justify-center px-3 py-3 sm:py-6 relative overflow-hidden">
        {/* Decorative dots */}
        <div className="absolute left-0 top-1/3 w-20 h-32 reg-dots opacity-50 pointer-events-none" />
        <div className="absolute right-0 bottom-1/4 w-16 h-24 reg-dots opacity-40 pointer-events-none" />
        {/* Waves */}
        <svg className="absolute bottom-0 right-0 w-48 h-24 opacity-[0.06] pointer-events-none" viewBox="0 0 256 128" fill="none">
          <path d="M0 64 Q64 0 128 64 T256 64 V128 H0 Z" fill="#0D9488" />
        </svg>

        {/* Card */}
        <div className="w-full max-w-[380px] bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] px-4 py-4 sm:px-6 sm:py-6 relative z-10">
          {/* Header: illustration + text side by side */}
          <div className="flex items-center gap-2.5 mb-2 sm:mb-3">
            <HouseIllustration />
            <div className="text-left">
              <h1 className="font-display font-bold text-xl sm:text-2xl text-surface-900 tracking-tight">
                Create an account
              </h1>
              <p className="text-surface-500 text-xs sm:text-sm mt-0.5">
                Start searching for rooms and roommates today.
              </p>
            </div>
          </div>

          {step === 'verify-email' ? (
            /* Email Verification Step */
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto mb-3 bg-primary-50 rounded-full flex items-center justify-center">
                <Mail size={28} className="text-primary-500" />
              </div>
              <h2 className="font-display font-bold text-lg text-surface-900 mb-1">Check your email</h2>
              <p className="text-surface-500 text-xs mb-4">
                We've sent a verification link to<br />
                <span className="font-medium text-surface-700">{form.email}</span>
              </p>

              {verificationUrl && (
                <div className="bg-surface-50 rounded-lg p-3 mb-4">
                  <p className="text-[10px] text-surface-400 mb-1">For development, click the link below:</p>
                  <a href={verificationUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-primary-600 hover:underline break-all">
                    {verificationUrl}
                  </a>
                </div>
              )}

              <button onClick={() => setStep('form')}
                className="text-xs text-primary-600 hover:underline font-medium">
                ← Back to registration
              </button>
            </div>
          ) : (
            <>
              {/* Google SSO */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={googleLoading}
                className="w-full flex items-center justify-between border border-surface-200 rounded-xl px-3 py-2 text-[13px] font-medium text-surface-700 bg-white hover:bg-surface-50 hover:border-surface-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed mb-2"
              >
                <div className="flex items-center gap-2.5">
                  {googleLoading ? (
                    <div className="w-4 h-4 border-2 border-surface-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  <span>{googleLoading ? 'Signing up...' : 'Continue with Google'}</span>
                </div>
                {!googleLoading && <ArrowRight size={14} className="text-surface-400" />}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-surface-200" />
                <span className="text-[10px] text-surface-400 font-medium">or</span>
                <div className="flex-1 h-px bg-surface-200" />
              </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-2 sm:space-y-2.5">
            {/* Full Name */}
            <div>
              <label htmlFor="reg-name" className="block text-[11px] font-medium text-surface-700 mb-0.5">Full Name</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"><User size={13} /></span>
                <input id="reg-name" name="name" type="text" value={form.name} onChange={handleChange} placeholder="e.g. Rahul Kumar" autoFocus
                  className={`w-full pl-8 pr-2.5 py-1.5 rounded-lg border text-[13px] bg-surface-50/50 text-surface-900 placeholder:text-surface-400 transition-all focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${errors.name ? 'border-red-400' : 'border-surface-200'}`} />
              </div>
              {errors.name && <p className="text-[10px] text-red-500 mt-0.5">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-[11px] font-medium text-surface-700 mb-0.5">Email Address</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"><Mail size={13} /></span>
                <input id="reg-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="e.g. rahul@example.com"
                  className={`w-full pl-8 pr-2.5 py-1.5 rounded-lg border text-[13px] bg-surface-50/50 text-surface-900 placeholder:text-surface-400 transition-all focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${errors.email ? 'border-red-400' : 'border-surface-200'}`} />
              </div>
              {errors.email && <p className="text-[10px] text-red-500 mt-0.5">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="reg-phone" className="block text-[11px] font-medium text-surface-700 mb-0.5">Phone Number (10 digits)</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"><Phone size={13} /></span>
                <input id="reg-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="e.g. 9876543210" inputMode="numeric" maxLength={10}
                  className={`w-full pl-8 pr-2.5 py-1.5 rounded-lg border text-[13px] bg-surface-50/50 text-surface-900 placeholder:text-surface-400 transition-all focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${errors.phone ? 'border-red-400' : 'border-surface-200'}`} />
              </div>
              {errors.phone && <p className="text-[10px] text-red-500 mt-0.5">{errors.phone}</p>}
            </div>

            {/* Role toggle */}
            <div>
              <label className="block text-[11px] font-medium text-surface-700 mb-0.5">I want to register as a:</label>
              <div className="grid grid-cols-2 gap-1 bg-surface-100 p-0.5 rounded-lg">
                {[
                  { value: 'TENANT', label: 'Tenant', icon: User },
                  { value: 'OWNER', label: 'Owner', icon: Mail },
                ].map(({ value, label, icon: Icon }) => (
                  <button key={value} type="button" onClick={() => setForm((p) => ({ ...p, role: value }))}
                    className={`flex items-center justify-center gap-1 py-1 text-[11px] font-semibold rounded-md transition-all ${
                      form.role === value ? 'bg-white text-primary-600 shadow-sm' : 'text-surface-500 hover:text-surface-700'
                    }`}>
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <PasswordInput label="Password" name="password" id="reg-password" value={form.password} onChange={handleChange} placeholder="Enter password" error={errors.password} />

            {/* Confirm Password */}
            <PasswordInput label="Confirm Password" name="confirmPassword" id="reg-confirm" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm password" error={errors.confirmPassword} />

            {/* Terms */}
            <div className="flex items-start gap-1.5">
              <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange}
                className="mt-0.5 w-3 h-3 rounded border-surface-300 text-primary-600 focus:ring-primary-400 cursor-pointer" />
              <span className="text-[10px] text-surface-500 leading-snug">
                I agree to the{' '}
                <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>.
              </span>
            </div>
            {errors.terms && <p className="text-[10px] text-red-500">{errors.terms}</p>}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Sign Up <ArrowRight size={14} /></>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-surface-500 mt-3">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:underline font-semibold">Sign In</Link>
          </p>
          </>
          )}
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
