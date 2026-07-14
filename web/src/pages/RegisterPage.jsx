import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Lock,
  Phone,
  Home,
  Users,
  Shield,
  Star,
  ArrowRight,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui/index.js';

// ─── Static features list ──────────────────────────────────────────────────
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

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'TENANT',
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!form.terms) {
      newErrors.terms = 'You must agree to the Terms of Service';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
      });
      toast.success('Registration successful! Welcome to Roomiee.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-50 font-sans">
      {/* Left panel - Branding (Visible on large screens) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 p-12 relative overflow-hidden">
        {/* Blobs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
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

        {/* Hero Content */}
        <div className="relative z-10 my-6">
          <h1 className="text-white font-display font-bold text-4xl leading-tight tracking-tight">
            Join the community of
            <br />
            <span className="text-accent-300">smart home seekers</span>
          </h1>
          <p className="text-primary-200 mt-4 text-base leading-relaxed max-w-sm">
            Whether you want to list your space as an Owner or find your next flat as a Tenant, Roomiee has got you covered.
          </p>

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

        {/* Footer */}
        <div className="relative z-10 text-primary-300 text-xs flex justify-between">
          <span>&copy; {new Date().getFullYear()} Roomy.in</span>
          <span>Made for India</span>
        </div>
      </div>

      {/* Right panel - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center lg:text-left">
            <h2 className="font-display font-bold text-3xl text-surface-900 tracking-tight">
              Create an account
            </h2>
            <p className="text-surface-500 text-sm mt-2">
              Start searching for rooms and roommates today.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Rahul Kumar"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
              icon={User}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. rahul@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              icon={Mail}
            />

            <Input
              label="Phone Number (10 digits)"
              type="tel"
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              error={errors.phone}
              icon={Phone}
            />

            {/* Role switch toggle container */}
            <div>
              <label className="label">I want to register as a:</label>
              <div className="grid grid-cols-2 gap-2 bg-surface-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'TENANT' })}
                  className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                    form.role === 'TENANT'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-surface-600 hover:text-surface-900'
                  }`}
                >
                  Tenant
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'OWNER' })}
                  className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                    form.role === 'OWNER'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-surface-600 hover:text-surface-900'
                  }`}
                >
                  Owner
                </button>
              </div>
            </div>

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              icon={Lock}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
              icon={Lock}
            />

            {/* Terms checkbox */}
            <div className="flex flex-col">
              <label className="inline-flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.terms}
                  onChange={(e) => setForm({ ...form, terms: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-primary-600 focus:ring-primary-500 accent-primary-600"
                />
                <span className="text-xs text-surface-500 leading-normal">
                  I agree to the{' '}
                  <a href="#" className="text-primary-600 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary-600 hover:underline">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
              {errors.terms && <p className="error-text">{errors.terms}</p>}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              loading={loading}
            >
              Sign Up <ArrowRight size={16} />
            </Button>
          </form>

          {/* Redirect */}
          <div className="text-center">
            <p className="text-sm text-surface-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:underline font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
