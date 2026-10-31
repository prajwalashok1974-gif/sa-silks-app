import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Gem } from 'lucide-react';
import { required } from '../lib/validation';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const normalizedEmail = required(email, 'Email').toLowerCase();
      required(password, 'Password');
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) throw error;
      setSuccess('Login successful!');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const normalizedEmail = required(email, 'Email').toLowerCase();
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }
      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (error) throw error;
      setSuccess('Sign up successful! Check your email to confirm.');
      setTimeout(() => {
        setMode('login');
        setEmail('');
        setPassword('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const normalizedEmail = required(email, 'Email').toLowerCase();
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setSuccess('Password reset email sent! Check your inbox.');
      setTimeout(() => {
        setMode('login');
        setEmail('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-rose-500/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl p-8 md:p-10">
          {/* Branding */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                <Gem className="text-white" size={32} />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-200 to-rose-200 bg-clip-text text-transparent mb-2">
              SA SILKS
            </h1>
            <p className="text-gray-400 text-sm">Premium Saree Business Suite</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg text-sm mb-4 backdrop-blur-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-100 px-4 py-3 rounded-lg text-sm mb-4 backdrop-blur-sm">
              {success}
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-purple-400" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-purple-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-purple-400 hover:text-purple-300 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full group"
            >
              <span>{loading ? 'Logging in...' : 'Login'}</span>
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </button>

            <div className="text-center space-y-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setError('');
                  setSuccess('');
                }}
                className="text-sm text-purple-300 hover:text-purple-200 transition"
              >
                Forgot password?
              </button>
              <p className="text-gray-400 text-sm">
                Need an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-purple-300 hover:text-purple-200 font-semibold transition"
                >
                  Sign up
                </button>
              </p>
            </div>
          </form>
        )}
  {/* Signup Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-purple-400" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-purple-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-purple-400 hover:text-purple-300 transition"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-purple-300 mt-1">At least 8 characters recommended</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full group"
              >
                <span>{loading ? 'Creating account...' : 'Create Account'}</span>
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </button>

              <div className="text-center pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-sm text-purple-300 hover:text-purple-200 font-semibold transition"
                >
                  Back to login
                </button>
              </div>
            </form>
          )}

          {/* Password Reset Form */}
          {mode === 'reset' && (
            <form onSubmit={handlePasswordReset} className="space-y-5">
              <p className="text-sm text-purple-200 mb-4">Enter your email and we'll send you a link to reset your password.</p>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-purple-400" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full group"
              >
                <span>{loading ? 'Sending link...' : 'Send Reset Link'}</span>
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </button>

              <div className="text-center pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-sm text-purple-300 hover:text-purple-200 font-semibold transition"
                >
                  Back to login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
