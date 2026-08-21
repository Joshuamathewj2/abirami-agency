'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { registerUserAction } from '@/app/actions/authActions';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Handle URL mode query (e.g. ?mode=register)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      if (mode === 'register') {
        setActiveTab('register');
      }
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams(window.location.search);
      const nextPath = params.get('redirect') || params.get('next') || '/user';
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google login');
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Sign in via Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      if (!data.user) throw new Error('Failed to retrieve user session.');

      // Check user role from profiles database table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const userRole = profile?.role?.toLowerCase() || 'customer';
      
      const params = new URLSearchParams(window.location.search);
      const nextPath = params.get('redirect') || params.get('next') || (userRole === 'admin' ? '/admin' : '/user');

      setSuccess('Logged in successfully! Redirecting...');
      router.push(nextPath);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all registration fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Call server action to sign up and insert profile RLS-bypassed
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('confirmPassword', confirmPassword);

      const res = await registerUserAction(formData);

      if (!res.success) {
        throw new Error(res.error || 'Failed to register.');
      }

      setSuccess('Account created successfully! Signing in...');

      // Auto login after signup
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Explicit Client Sign-Up Sync Fallback
      if (data?.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email || email,
          full_name: fullName,
          role: data.user.email === 'joshuamathewj2@gmail.com' ? 'admin' : 'customer'
        });
      }
      
      const params = new URLSearchParams(window.location.search);
      const nextPath = params.get('redirect') || params.get('next') || '/user';

      router.push(nextPath);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 bg-gray-50/50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm transition-all duration-300 hover:shadow-md">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center justify-center mb-6 gap-1">
              <img src="/logo.svg" alt="Abirami Agency Logo" className="h-16 w-auto object-contain -mb-2" />
              <div className="flex flex-col items-center justify-center">
                <span className="font-playfair text-3xl font-black text-primary leading-none tracking-tight">
                  Abirami
                </span>
                <span className="text-xs font-bold text-gray-500 tracking-[0.25em] uppercase leading-none mt-2">
                  Agency
                </span>
              </div>
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              {activeTab === 'login' ? 'Welcome Back' : 'Create an Account'}
            </h1>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mt-1">
              Premium Bath & Sanitaryware Portal
            </p>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-gray-150 mb-6 gap-2">
            <button
              onClick={() => { setActiveTab('login'); setError(null); setSuccess(null); }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'login' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(null); setSuccess(null); }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'register' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Register
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-100 text-red-650 rounded-xl text-xs font-bold leading-relaxed">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3.5 bg-green-50 border border-green-150 text-green-700 rounded-xl text-xs font-bold leading-relaxed">
              ✨ {success}
            </div>
          )}

          {/* Forms Section */}
          <div className="space-y-6">
            {activeTab === 'login' ? (
              // SIGN IN FORM
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs font-bold"
                    placeholder="e.g. name@gmail.com"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                      Password
                    </label>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs font-bold"
                    placeholder="Enter password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-extrabold uppercase tracking-widest shadow-md shadow-sky-100 hover:shadow-sky-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            ) : (
              // REGISTER FORM
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs font-bold"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs font-bold"
                    placeholder="e.g. name@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs font-bold"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs font-bold"
                    placeholder="Repeat password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-extrabold uppercase tracking-widest shadow-md shadow-sky-100 hover:shadow-sky-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? 'Creating Account...' : 'Register & Sign Up'}
                </button>
              </form>
            )}

            {/* Google OAuth Section */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-450 text-[10px] font-extrabold uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              type="button"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-800 font-extrabold text-xs py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            <Link href="/" className="hover:text-slate-800 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
