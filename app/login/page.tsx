'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      setAuth(response.data.user, response.data.access_token, rememberMe);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-slate-200 dark:border-gray-700">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 dark:text-blue-400 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-600 dark:text-gray-300">
                Keep me signed in
              </label>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 dark:bg-slate-700 text-white py-3 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Sign Up Button */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700">
            <Link
              href="/signup"
              className="w-full block text-center bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-semibold transition"
            >
              Create New Account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400 dark:text-gray-500">
          Need help? Contact support
        </p>
      </div>
    </div>
  );
}

