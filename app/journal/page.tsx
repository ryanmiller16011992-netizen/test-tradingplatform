'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, isSameDay, isSameMonth, getWeek } from 'date-fns';
import ThemeToggle from '@/components/ThemeToggle';

interface LedgerEntry {
  id: string;
  entryType: string;
  amount: number;
  balanceAfter: number;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: Date;
  metadata?: any;
}

interface TradeEntry {
  id: string;
  date: Date;
  symbol: string;
  side: string;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  commission: number;
  swap: number;
  type: string;
}

interface DayTrades {
  date: Date;
  trades: TradeEntry[];
  totalPnl: number;
  tradeCount: number;
}

interface WeekSummary {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  totalPnl: number;
  tradeCount: number;
  daysWithTrades: number;
}

export default function JournalPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!user && !token) {
      router.push('/login');
      return;
    }

    const fetchLedger = async () => {
      try {
        const response = await api.get('/ledger');
        const entries = response.data.map((entry: any) => ({
          ...entry,
          createdAt: new Date(entry.createdAt),
          amount: typeof entry.amount === 'string' ? parseFloat(entry.amount) : entry.amount,
          balanceAfter: typeof entry.balanceAfter === 'string' ? parseFloat(entry.balanceAfter) : entry.balanceAfter,
        }));
        setLedgerEntries(entries);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch ledger:', error);
        setLoading(false);
      }
    };

    fetchLedger();
  }, [user, router]);

  // Extract trades from ledger entries
  const trades = useMemo(() => {
    const tradeEntries: TradeEntry[] = [];
    const tradeMap = new Map<string, Partial<TradeEntry>>();

    const sortedEntries = [...ledgerEntries].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sortedEntries
      .filter(entry => entry.entryType === 'trade_open' || entry.entryType === 'trade_close')
      .forEach(entry => {
        const referenceId = entry.referenceId || '';
        const metadata = entry.metadata || {};
        
        if (entry.entryType === 'trade_open') {
          const key = metadata.positionId || referenceId;
          tradeMap.set(key, {
            id: key,
            date: entry.createdAt,
            symbol: metadata.symbol || 'N/A',
            side: metadata.side || 'buy',
            quantity: typeof metadata.quantity === 'string' ? parseFloat(metadata.quantity) : (metadata.quantity || 0),
            entryPrice: typeof metadata.price === 'string' ? parseFloat(metadata.price) : (metadata.price || 0),
            type: 'open',
            commission: typeof metadata.commission === 'string' ? parseFloat(metadata.commission) : (metadata.commission || 0),
            swap: typeof metadata.swap === 'string' ? parseFloat(metadata.swap) : (metadata.swap || 0),
          });
        } else if (entry.entryType === 'trade_close') {
          const openTrade = tradeMap.get(referenceId);
          if (openTrade) {
            const exitPrice = typeof metadata.price === 'string' ? parseFloat(metadata.price) : (metadata.price || 0);
            const realizedPnl = typeof metadata.realizedPnl === 'string' ? parseFloat(metadata.realizedPnl) : (metadata.realizedPnl || entry.amount || 0);
            const commission = typeof metadata.commission === 'string' ? parseFloat(metadata.commission) : (metadata.commission || 0);
            const swap = typeof metadata.swap === 'string' ? parseFloat(metadata.swap) : (metadata.swap || 0);
            
            tradeEntries.push({
              id: referenceId,
              date: entry.createdAt,
              symbol: metadata.symbol || openTrade.symbol || 'N/A',
              side: metadata.side || openTrade.side || 'buy',
              quantity: typeof metadata.quantity === 'string' ? parseFloat(metadata.quantity) : (metadata.quantity || openTrade.quantity || 0),
              entryPrice: openTrade.entryPrice || 0,
              exitPrice,
              pnl: realizedPnl,
              commission: commission + (openTrade.commission || 0),
              swap: swap + (openTrade.swap || 0),
              type: 'close',
            });
            tradeMap.delete(referenceId);
          }
        }
      });

    return tradeEntries.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [ledgerEntries]);

  // Group trades by day
  const tradesByDay = useMemo(() => {
    const grouped = new Map<string, TradeEntry[]>();
    
    trades.forEach(trade => {
      const dayKey = format(trade.date, 'yyyy-MM-dd');
      if (!grouped.has(dayKey)) {
        grouped.set(dayKey, []);
      }
      grouped.get(dayKey)!.push(trade);
    });

    const dayTrades: DayTrades[] = [];
    grouped.forEach((dayTradesList, dayKey) => {
      const date = new Date(dayKey);
      const totalPnl = dayTradesList.reduce((sum, t) => sum + t.pnl, 0);
      dayTrades.push({
        date,
        trades: dayTradesList.sort((a, b) => b.date.getTime() - a.date.getTime()),
        totalPnl,
        tradeCount: dayTradesList.length,
      });
    });

    return dayTrades;
  }, [trades]);

  // Get trades for selected month
  const monthTrades = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    return tradesByDay.filter(day => {
      const dayDate = day.date;
      return dayDate >= monthStart && dayDate <= monthEnd;
    });
  }, [tradesByDay, selectedMonth]);

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const totalPnl = monthTrades.reduce((sum, day) => sum + day.totalPnl, 0);
    const totalTrades = monthTrades.reduce((sum, day) => sum + day.tradeCount, 0);
    const daysWithTrades = monthTrades.length;

    return {
      totalPnl,
      totalTrades,
      daysWithTrades,
    };
  }, [monthTrades]);

  // Calculate weekly summaries
  const weeklySummaries = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    const weeks = new Map<number, WeekSummary>();
    
    monthTrades.forEach(dayTrade => {
      const weekNum = getWeek(dayTrade.date, { weekStartsOn: 0 });
      if (!weeks.has(weekNum)) {
        const weekStart = startOfWeek(dayTrade.date, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(dayTrade.date, { weekStartsOn: 0 });
        weeks.set(weekNum, {
          weekNumber: weekNum,
          startDate: weekStart,
          endDate: weekEnd,
          totalPnl: 0,
          tradeCount: 0,
          daysWithTrades: 0,
        });
      }
      
      const week = weeks.get(weekNum)!;
      week.totalPnl += dayTrade.totalPnl;
      week.tradeCount += dayTrade.tradeCount;
      week.daysWithTrades += 1;
    });

    return Array.from(weeks.values()).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [monthTrades, selectedMonth]);

  // Get calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [selectedMonth]);

  // Get trades for a specific day
  const getDayTrades = (date: Date): DayTrades | undefined => {
    const dayKey = format(date, 'yyyy-MM-dd');
    return tradesByDay.find(d => format(d.date, 'yyyy-MM-dd') === dayKey);
  }

  // Get selected day trades
  const selectedDayTrades = selectedDay ? getDayTrades(selectedDay) : null;

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Top Navigation Bar */}
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none">XPT</h1>
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">MARKETS</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with Month Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Trading Journal</h2>
            <p className="text-gray-600 dark:text-gray-400">Review your trading history day by day</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading trades...</p>
          </div>
        ) : trades.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No trades yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Start trading to see your journal entries here</p>
            <button
              onClick={() => router.push('/trading')}
              className="bg-gray-900 dark:bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition font-medium"
            >
              Open Trading Platform
            </button>
          </div>
        ) : (
          <>
            {/* Month Navigation and Stats */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {format(selectedMonth, 'MMMM yyyy')}
                  </h3>
                  <button
                    onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly stats</div>
                  <div className={`text-xl font-bold ${monthlyStats.totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {monthlyStats.totalPnl >= 0 ? '+' : ''}${monthlyStats.totalPnl.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {monthlyStats.daysWithTrades} days • {monthlyStats.totalTrades} trades
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  const dayTrades = getDayTrades(day);
                  const isCurrentMonth = isSameMonth(day, selectedMonth);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDay && isSameDay(day, selectedDay);

                  return (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedDay(day);
                        // Scroll to detail panel after a short delay
                        setTimeout(() => {
                          const detailPanel = document.getElementById('day-detail-panel');
                          if (detailPanel) {
                            detailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }
                        }, 100);
                      }}
                      className={`
                        min-h-[100px] p-2 rounded-lg border transition-all cursor-pointer
                        ${!isCurrentMonth ? 'opacity-30' : ''}
                        ${isToday ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
                        ${isSelected ? 'ring-2 ring-blue-600 dark:ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
                        ${dayTrades ? 'border-gray-300 dark:border-gray-600' : 'border-gray-200 dark:border-gray-700'}
                      `}
                    >
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {format(day, 'd')}
                      </div>
                      {dayTrades && (
                        <div className={`mt-1 p-2 rounded ${
                          dayTrades.totalPnl >= 0 
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        }`}>
                          <div className={`text-xs font-bold ${
                            dayTrades.totalPnl >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                          }`}>
                            {dayTrades.totalPnl >= 0 ? '+' : ''}${Math.abs(dayTrades.totalPnl).toFixed(0)}
                            {dayTrades.totalPnl >= 1000 ? 'K' : ''}
                          </div>
                          <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">
                            {dayTrades.tradeCount} {dayTrades.tradeCount === 1 ? 'trade' : 'trades'}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly Summaries */}
            {weeklySummaries.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Summary</h3>
                <div className="space-y-2">
                  {weeklySummaries.map((week, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          Week {week.weekNumber}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {format(week.startDate, 'MMM d')} - {format(week.endDate, 'MMM d')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          week.totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {week.totalPnl >= 0 ? '+' : ''}${week.totalPnl.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {week.tradeCount} trades • {week.daysWithTrades} days
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Day Trades Detail */}
            {selectedDay && (
              <div id="day-detail-panel" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {format(selectedDay, 'EEEE, MMMM d, yyyy')}
                    </h3>
                    {selectedDayTrades && (
                      <div className={`text-lg font-semibold mt-1 ${
                        selectedDayTrades.totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {selectedDayTrades.totalPnl >= 0 ? '+' : ''}${selectedDayTrades.totalPnl.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {selectedDayTrades && selectedDayTrades.trades.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Time</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Symbol</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Side</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Volume</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Entry</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Exit</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">P&L</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {selectedDayTrades.trades.map((trade) => (
                          <tr key={trade.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {format(trade.date, 'HH:mm')}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{trade.symbol}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                trade.side === 'buy' 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                              }`}>
                                {trade.side.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 text-right">{trade.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 text-right">{trade.entryPrice.toFixed(5)}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 text-right">{trade.exitPrice.toFixed(5)}</td>
                            <td className={`px-4 py-3 text-sm font-semibold text-right ${
                              trade.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">No trades on this day</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
