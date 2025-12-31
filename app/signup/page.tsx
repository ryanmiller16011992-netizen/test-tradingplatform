'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [startingBalance, setStartingBalance] = useState(10000);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Client-side validation
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address');
      setLoading(false);
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    if (startingBalance < 1000) {
      setError('Starting balance must be at least $1,000');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/signup', {
        email: email.trim(),
        password,
        startingBalance,
      });
      setAuth(response.data.user, response.data.access_token, false);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Signup error:', err);
      let errorMessage = 'Signup failed. Please try again.';
      
      if (err.response) {
        // Server responded with error
        if (err.response.data?.message) {
          errorMessage = Array.isArray(err.response.data.message) 
            ? err.response.data.message.join(', ')
            : err.response.data.message;
        } else if (err.response.data?.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.request) {
        // Request made but no response
        errorMessage = 'Unable to connect to server. Please check if the backend is running on port 3001.';
      } else {
        // Error setting up request
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: errorMessage,
        request: err.request,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="w-full max-w-md px-6">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
        </div>

        {/* Signup Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-slate-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">Create Account</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-gray-900 bg-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-gray-900 bg-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition"
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="balance" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                Starting Balance (USD)
              </label>
              <input
                id="balance"
                type="number"
                value={startingBalance}
                onChange={(e) => setStartingBalance(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-gray-900 bg-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition"
                min="1000"
                step="1000"
                required
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">Minimum: $1,000</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 dark:bg-slate-700 text-white py-3 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600 dark:text-gray-400 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                Sign In
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-gray-700">
            <p className="text-xs text-slate-500 dark:text-gray-400 text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

