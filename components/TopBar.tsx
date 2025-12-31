'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { AccountMetrics } from '@/types';
import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

interface TopBarProps {
  metrics: AccountMetrics | null;
}

export default function TopBar({ metrics }: TopBarProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  // Safely extract values with fallbacks
  const balance = metrics?.balance != null 
    ? (typeof metrics.balance === 'string' ? parseFloat(metrics.balance) : Number(metrics.balance) || 0)
    : 0;
  const equity = metrics?.equity != null 
    ? (typeof metrics.equity === 'string' ? parseFloat(metrics.equity) : Number(metrics.equity) || 0)
    : 0;
  const unrealizedPnl = metrics?.unrealizedPnl != null 
    ? (typeof metrics.unrealizedPnl === 'string' ? parseFloat(metrics.unrealizedPnl) : Number(metrics.unrealizedPnl) || 0)
    : 0;

  return (
    <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-3 hover:opacity-90 transition-all duration-200 group"
        >
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none">XPT</h1>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">MARKETS</span>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-all duration-200 font-medium"
          >
            Dashboard
          </button>
          <button
            onClick={() => router.push('/trading')}
            className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-lg shadow-blue-600/30"
          >
            Trading
          </button>
          <button
            onClick={() => router.push('/journal')}
            className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-all duration-200 font-medium"
          >
            Journal
          </button>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <div className="text-xs text-gray-700 dark:text-gray-400 font-medium">LIVE</div>
        </div>
        <div className="text-right px-4 py-2 bg-gray-100 dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-0.5">Profit</div>
          <div className={`text-sm font-bold ${unrealizedPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {unrealizedPnl >= 0 ? '+' : ''}{unrealizedPnl.toFixed(2)} USD
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="text-sm text-gray-700 dark:text-gray-300 font-medium px-3 py-1.5 bg-gray-100 dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800">{user?.email}</div>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-all duration-200 font-medium border border-gray-200 dark:border-gray-800"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

