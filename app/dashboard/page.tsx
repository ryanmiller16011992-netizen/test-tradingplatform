'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { getSocket } from '@/lib/websocket';
import { AccountMetrics } from '@/types';
import ThemeToggle from '@/components/ThemeToggle';

interface Account {
  id: string;
  accountNumber: string;
  balance: number;
  equity: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [metrics, setMetrics] = useState<AccountMetrics | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!user && !token) {
      router.push('/login');
      return;
    }
    if (!user) {
      return;
    }

    // Fetch current account
    const fetchAccount = async () => {
      try {
        const response = await api.get('/account');
        const account = response.data;
        // Convert balance to number (PostgreSQL returns decimals as strings)
        const balance = account.currentBalance != null
          ? (typeof account.currentBalance === 'string' ? parseFloat(account.currentBalance) : account.currentBalance)
          : 0;
        // For now, we'll use the single account. Later, this can be expanded to fetch multiple accounts
        const accountList: Account[] = [{
          id: account.id,
          accountNumber: account.accountNumber || account.id.substring(0, 8).toUpperCase(),
          balance: balance,
          equity: balance,
        }];
        setAccounts(accountList);
        setSelectedAccountId(account.id);
      } catch (error) {
        console.error('Failed to fetch account:', error);
      }
    };

    fetchAccount();
  }, [user, router]);

  useEffect(() => {
    if (!selectedAccountId) return;

    const fetchMetrics = async () => {
      try {
        const response = await api.get('/account/metrics');
        setMetrics(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);

    const socket = getSocket();
    socket.on('account:metrics', (data: AccountMetrics) => {
      setMetrics(data);
    });

    return () => {
      clearInterval(interval);
      socket.off('account:metrics');
    };
  }, [selectedAccountId]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user || loading || !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const balance = metrics.balance != null ? (typeof metrics.balance === 'string' ? parseFloat(metrics.balance) : metrics.balance) : 0;
  const equity = metrics.equity != null ? (typeof metrics.equity === 'string' ? parseFloat(metrics.equity) : metrics.equity) : 0;
  const profit = equity - balance;
  const profitPercent = balance > 0 ? ((profit / balance) * 100) : 0;
  const usedMargin = metrics.usedMargin != null ? (typeof metrics.usedMargin === 'string' ? parseFloat(metrics.usedMargin) : metrics.usedMargin) : 0;
  const marginLevel = metrics.marginLevel != null ? (typeof metrics.marginLevel === 'string' ? parseFloat(metrics.marginLevel) : metrics.marginLevel) : 0;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Top Navigation Bar */}
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none">XPT</h1>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">MARKETS</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">LIVE</span>
            </div>
            <ThemeToggle />
            <div className="text-sm text-gray-700 dark:text-gray-400 hidden sm:block font-mono">{user.email}</div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition px-4 py-2 rounded border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Account Selector */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Account Overview</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Select account to view metrics</p>
            </div>
            <div className="w-auto min-w-[280px]">
              <select
                value={selectedAccountId || ''}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-600"
              >
                {accounts.map((account) => {
                  const balance = typeof account.balance === 'number' ? account.balance : parseFloat(String(account.balance || '0')) || 0;
                  return (
                    <option key={account.id} value={account.id} className="bg-white dark:bg-gray-900">
                      {account.accountNumber} • ${balance.toFixed(2)}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Main Metrics - Tech Savvy Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Balance */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <div className="text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2 font-semibold">Balance</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 font-mono">${balance.toFixed(2)}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">USD</div>
          </div>

          {/* Equity */}
          <div className={`border rounded-lg p-5 transition-all ${
            equity >= balance 
              ? 'bg-white dark:bg-gray-900 border-green-500/30 dark:border-green-500/30 hover:border-green-500/50' 
              : 'bg-white dark:bg-gray-900 border-red-500/30 dark:border-red-500/30 hover:border-red-500/50'
          }`}>
            <div className="text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2 font-semibold">Equity</div>
            <div className={`text-3xl font-bold mb-1 font-mono ${
              equity >= balance ? 'text-green-400' : 'text-red-400'
            }`}>
              ${equity.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Account Value</div>
          </div>

          {/* Profit/Loss */}
          <div className={`border rounded-lg p-5 transition-all ${
            profit >= 0 
              ? 'bg-white dark:bg-gray-900 border-green-500/30 dark:border-green-500/30 hover:border-green-500/50' 
              : 'bg-white dark:bg-gray-900 border-red-500/30 dark:border-red-500/30 hover:border-red-500/50'
          }`}>
            <div className="text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2 font-semibold">P&L</div>
            <div className={`text-3xl font-bold mb-1 font-mono ${
              profit >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
            </div>
            <div className={`text-sm font-medium ${
              profit >= 0 ? 'text-green-400/80' : 'text-red-400/80'
            }`}>
              {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Secondary Metrics - Compact Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <div className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5 font-semibold">Used Margin</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white font-mono">${usedMargin.toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <div className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5 font-semibold">Margin Level</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white font-mono">
              {marginLevel > 0 ? `${marginLevel.toFixed(1)}%` : '—'}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <div className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5 font-semibold">Positions</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white font-mono">{metrics.openPositions || 0}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <div className="text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5 font-semibold">Free Margin</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white font-mono">
              ${(equity - usedMargin).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Quick Actions - Tech Savvy Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/trading')}
            className="group relative bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 border border-blue-500 dark:border-blue-600 rounded-lg p-6 text-left hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all overflow-hidden shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 border border-white/30 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-semibold text-white mb-1">Trading Platform</div>
                  <div className="text-sm text-blue-100">Live charts & execution</div>
                </div>
              </div>
              <div className="text-white group-hover:translate-x-1 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/journal')}
            className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-left hover:border-gray-300 dark:hover:border-gray-600 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-600/0 to-gray-600/0 group-hover:from-gray-600/10 group-hover:to-gray-600/5 transition-all"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-all">
                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Trading Journal</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">History & analytics</div>
                </div>
              </div>
              <div className="text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 group-hover:translate-x-1 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

