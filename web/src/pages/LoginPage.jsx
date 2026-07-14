// LoginPage — split layout auth page for Roomiee
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Home,
  Users,
  Shield,
  Star,
  ArrowRight,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui/index.js';

// ─── Static data ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Home,
    title: 'Verified Listings',
    desc: 'Every property is ID-verified and physically inspected.',
  },
  {
    icon: Users,
    title: 'Smart Roommate Match',
    desc: 'AI-powered compatibility scoring based on lifestyle preferences.',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    desc: 'Escrow-protected rent deposits with instant refunds.',
  },
];

const TESTIMONIAL = {
  quote:
    '"Found my perfect PG in Bangalore in under 48 hours. The owner was verified and communication was super smooth!"',
  name: 'Priya Sharma',
  role: 'Software Engineer, Bengaluru',
  rating: 5,
};

// ─── Left branding panel ─────────────────────────────────────────────────────

const LeftPanel = () => (
  <div className="hidden lg:flex flex-col justify-between h-full bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 p-12 relative overflow-hidden">
    {/* Decorative blobs */}
    <div className="absolute -top-24 -left-24 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-400/10 rounded-full blur-2xl pointer-events-none" />

    {/* Brand */}
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
          <Home size={20} className="text-white" />
        </div>
        <span className="text-white font-display font-bold text-2xl tracking-tight">
          Roomiee
        </span>
      </div>
      <p className="text-primary-200 text-sm font-medium mt-2">
        India's most trusted rental platform
      </p>
    </div>

    {/* Hero copy */}
    <div className="relative z-10 my-10">
      <h1 className="text-white font-display font-bold text-4xl leading-tight tracking-tight">
        Find your{' '}
        <span className="text-accent-300">perfect home</span>
        <br />
        in any city.
      </h1>
      <p className="text-primary-200 mt-4 text-base leading-relaxed max-w-sm">
        Discover verified PGs, flats, and rooms — and find roommates who match your vibe
        across 50+ Indian cities.
      </p>

      {/* Feature list */}
      <div className="mt-8 space-y-5">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-4">
            <div className="w-9 h-9 shrink-0 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/10">
              <Icon size={16} className="text-accent-300" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight">{title}</p>
              <p className="text-primary-300 text-xs mt-0.5 leading-snug">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Testimonial */}
    <div className="relative z-10 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5">
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: TESTIMONIAL.rating }).map((_, i) => (
          <Star key={i} size={13} className="text-accent-300 fill-accent-300" />
        ))}
      </div>
      <p className="text-white/90 text-sm leading-relaxed italic">{TESTIMONIAL.quote}</p>
      <div className="mt-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-primary-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {TESTIMONIAL.name[0]}
        </div>
        <div>
          <p className="text-white text-sm font-semibold leading-tight">{TESTIMONIAL.name}</p>
          <p className="text-primary-300 text-xs mt-0.5">{TESTIMONIAL.role}</p>
        </div>
      </div>
    </div>
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

// ─── Google Icon SVG ─────────────────────────────────────────────────────────
const GoogleIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const INITIAL_FORM = { email: '', password: '', remember: false };

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect to the page the user was trying to reach, else dashboard
  const from = location.state?.from?.pathname ?? '/dashboard';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
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

  const handleGoogleLogin = () => {
    toast('Google login coming soon!', { icon: '🚀' });
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="lg:w-[52%] xl:w-[55%]">
        <LeftPanel />
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-50 px-6 py-12 lg:px-12">
        {/* Mobile brand */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Home size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl text-primary-700">Roomiee</span>
        </div>

        {/* Glass card */}
        <div className="w-full max-w-md bg-white/80 backdrop-blur-md border border-surface-100 rounded-3xl shadow-card p-8 md:p-10">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="font-display font-bold text-2xl text-surface-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-surface-500 text-sm mt-1.5">
              Sign in to your Roomiee account
            </p>
          </div>

          {/* Google SSO */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 border border-surface-200 rounded-xl px-4 py-3 text-sm font-medium text-surface-700 bg-white hover:bg-surface-50 hover:border-surface-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 active:scale-[0.99]"
          >
            <GoogleIcon />
            Continue with Google
          </button>


          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-surface-200" />
            <span className="text-xs text-surface-400 font-medium tracking-wider uppercase">
              or sign in with email
            </span>
            <div className="flex-1 h-px bg-surface-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <Input
              label="Email address"
              name="email"
              id="login-email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              icon={Mail}
              error={errors.email}
              autoComplete="email"
              autoFocus
            />

            {/* Password */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="label mb-0">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary-600 font-medium hover:text-primary-700 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 flex items-center text-gray-400 pointer-events-none">
                  <Lock size={16} />
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
                  className={[
                    'input w-full pl-9 pr-11',
                    errors.password ? 'border-red-500 focus:ring-red-400' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 text-surface-400 hover:text-surface-600 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p id="login-password-error" className="error-text">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-3 cursor-pointer group select-none">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-400 cursor-pointer"
              />
              <span className="text-sm text-surface-600 group-hover:text-surface-800 transition-colors">
                Remember me for 30 days
              </span>
            </label>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              {loading ? 'Signing in…' : (
                <>
                  Sign in
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-surface-500 mt-7">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary-600 font-semibold hover:text-primary-700 hover:underline transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>

        {/* Legal */}
        <p className="text-xs text-surface-400 mt-8 text-center">
          By signing in you agree to our{' '}
          <a href="/terms" className="underline hover:text-surface-600 transition-colors">
            Terms
          </a>{' '}
          &amp;{' '}
          <a href="/privacy" className="underline hover:text-surface-600 transition-colors">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
