// LoginPage — clean centered card design for Quikden
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';

// Google Client ID — replace with your actual client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// ─── Google Icon SVG ─────────────────────────────────────────────────────────
const GoogleIcon = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

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

// ─── Validation ───────────────────────────────────────────────────────────────

const validate = ({ email, password }) => {
  const errors = {};
  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address';
  }
  if (!password) errors.password = 'Password is required';
  return errors;
};

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 ${
        checked ? 'bg-primary-500' : 'bg-surface-300'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md ring-0 transform transition duration-200 ease-in-out mt-0.5 ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const INITIAL_FORM = { email: '', password: '', remember: false };

export default function LoginPage() {
  const { login, googleAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const from = location.state?.from?.pathname ?? '/dashboard';

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

    // Load Google Identity Services script
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
        toast.success('Welcome back! 👋');
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google login failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast('Google login not configured yet', { icon: '⚠️' });
      return;
    }
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      toast('Google Sign-In is loading, please try again', { icon: '⏳' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await login({ email: form.email.trim().toLowerCase(), password: form.password });
      toast.success('Welcome back! 👋');
      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ?? 'Login failed. Please check your credentials.';
      toast.error(msg);
      setErrors({ password: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <style>{`
        .login-bg {
          background-color: #f0fdfa;
          background-image:
            radial-gradient(circle at 20% 80%, rgba(13,148,136,0.04) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(13,148,136,0.04) 0%, transparent 50%);
        }
        .login-dots-left {
          background-image: radial-gradient(circle, rgba(13,148,136,0.15) 1px, transparent 1px);
          background-size: 16px 16px;
        }
        .login-dots-right {
          background-image: radial-gradient(circle, rgba(13,148,136,0.12) 1px, transparent 1px);
          background-size: 16px 16px;
        }
      `}</style>

      <div className="min-h-screen login-bg flex items-center justify-center px-3 py-3 sm:py-6 relative overflow-hidden">
        {/* Decorative dots — left */}
        <div className="absolute left-0 top-1/4 w-24 h-40 login-dots-left opacity-60 pointer-events-none" />
        {/* Decorative dots — right */}
        <div className="absolute right-0 bottom-1/4 w-20 h-32 login-dots-right opacity-50 pointer-events-none" />
        {/* Decorative wave — bottom right */}
        <svg className="absolute bottom-0 right-0 w-64 h-32 opacity-[0.07] pointer-events-none" viewBox="0 0 256 128" fill="none">
          <path d="M0 64 Q64 0 128 64 T256 64 V128 H0 Z" fill="#0D9488" />
        </svg>
        {/* Decorative wave — top left */}
        <svg className="absolute top-0 left-0 w-48 h-24 opacity-[0.05] pointer-events-none" viewBox="0 0 256 128" fill="none">
          <path d="M0 64 Q64 128 128 64 T256 64 V0 H0 Z" fill="#0D9488" />
        </svg>

        {/* Card */}
        <div className="w-full max-w-[380px] bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] px-4 py-4 sm:px-6 sm:py-6 relative z-10">
          {/* Header: illustration + text side by side */}
          <div className="flex items-center gap-2.5 mb-2 sm:mb-3">
            <HouseIllustration />
            <div className="text-left">
              <h1 className="font-display font-bold text-lg sm:text-xl text-surface-900 tracking-tight">
                Welcome back!
              </h1>
              <p className="text-surface-500 text-[11px] sm:text-xs mt-0.5">
                Sign in to your QuikDen account
              </p>
            </div>
          </div>

          {/* Google SSO */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-between border border-surface-200 rounded-xl px-3 py-2 text-[13px] font-medium text-surface-700 bg-white hover:bg-surface-50 hover:border-surface-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2.5">
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-surface-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span>{googleLoading ? 'Signing in...' : 'Continue with Google'}</span>
            </div>
            {!googleLoading && <ArrowRight size={14} className="text-surface-400" />}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-2 sm:my-2.5">
            <div className="flex-1 h-px bg-surface-200" />
            <span className="text-[11px] text-surface-400 font-medium">or</span>
            <div className="flex-1 h-px bg-surface-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-2 sm:space-y-2.5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-[11px] font-medium text-surface-700 mb-0.5">
                Email address
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
                  <Mail size={13} />
                </span>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                  className={`w-full pl-8 pr-2.5 py-1.5 rounded-lg border text-[13px] bg-surface-50/50 text-surface-900 placeholder:text-surface-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
                    errors.email ? 'border-red-400 focus:ring-red-400' : 'border-surface-200'
                  }`}
                />
              </div>
              {errors.email && (
                <p id="login-email-error" className="text-[10px] text-red-500 mt-0.5">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label htmlFor="login-password" className="text-[11px] font-medium text-surface-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[10px] text-primary-600 font-medium hover:text-primary-700 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
                  <Lock size={13} />
                </span>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  className={`w-full pl-8 pr-9 py-1.5 rounded-lg border text-[13px] bg-surface-50/50 text-surface-900 placeholder:text-surface-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
                    errors.password ? 'border-red-400 focus:ring-red-400' : 'border-surface-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {errors.password && (
                <p id="login-password-error" className="text-[10px] text-red-500 mt-0.5">{errors.password}</p>
              )}
            </div>

            {/* Remember me — toggle switch */}
            <div className="flex items-center gap-2.5">
              <ToggleSwitch
                checked={form.remember}
                onChange={(val) => setForm((prev) => ({ ...prev, remember: val }))}
              />
              <span className="text-[12px] text-surface-600 select-none cursor-pointer" onClick={() => setForm((prev) => ({ ...prev, remember: !prev.remember }))}>
                Remember me for 30 days
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-[13px] font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-[11px] sm:text-xs text-surface-500 mt-3 sm:mt-3.5">
            New to QuikDen?{' '}
            <Link
              to="/register"
              className="text-primary-600 font-semibold hover:text-primary-700 hover:underline transition-colors inline-flex items-center gap-1"
            >
              Create your account
              <ArrowRight size={14} />
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
