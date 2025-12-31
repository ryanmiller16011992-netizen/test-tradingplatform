'use client';

import { useState, useEffect } from 'react';
import { Position } from '@/types';
import api from '@/lib/api';
import { format } from 'date-fns';

export default function PositionsTable() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [activeTab, setActiveTab] = useState<'open' | 'pending' | 'closed' | 'finance'>('open');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await api.get('/positions');
        setPositions(response.data);
      } catch (error) {
        console.error('Failed to fetch positions:', error);
      }
    };

    fetchPositions();
    const interval = setInterval(fetchPositions, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClosePosition = async (positionId: string) => {
    if (!confirm('Are you sure you want to close this position?')) return;

    setLoading(true);
    try {
      await api.post(`/positions/${positionId}/close`);
      const response = await api.get('/positions');
      setPositions(response.data);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to close position');
    } finally {
      setLoading(false);
    }
  };

  const openPositions = positions.filter(p => !p.closedAt);
  const closedPositions = positions.filter(p => p.closedAt);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black backdrop-blur-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 flex-shrink-0 bg-gray-50 dark:bg-black">
        <button
          onClick={() => setActiveTab('open')}
          className={`px-6 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'open'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-black'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-gray-900'
          }`}
        >
          Open Positions {openPositions.length > 0 && `(${openPositions.length})`}
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'pending'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-black'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-gray-900'
          }`}
        >
          Pending Orders
        </button>
        <button
          onClick={() => setActiveTab('closed')}
          className={`px-6 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'closed'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-black'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-gray-900'
          }`}
        >
          Closed Positions
        </button>
        <button
          onClick={() => setActiveTab('finance')}
          className={`px-6 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'finance'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-black'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-gray-900'
          }`}
        >
          Finance
        </button>
      </div>

      {/* Table - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
        {activeTab === 'open' && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Symbol</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Volume</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Open Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">TP/SL</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Open Time</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Swap</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">PnL</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {openPositions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No open positions
                  </td>
                </tr>
              ) : (
                openPositions.map((position) => {
                  const pnl = position.unrealizedPnl != null
                    ? (typeof position.unrealizedPnl === 'string' 
                        ? parseFloat(position.unrealizedPnl) 
                        : position.unrealizedPnl)
                    : 0;
                  const avgEntryPrice = position.averageEntryPrice != null
                    ? (typeof position.averageEntryPrice === 'string'
                        ? parseFloat(position.averageEntryPrice)
                        : position.averageEntryPrice)
                    : 0;
                  const pnlPercent = avgEntryPrice > 0
                    ? ((pnl / (avgEntryPrice * position.quantity * (position.instrument?.contractSize || 1))) * 100)
                    : 0;

                  return (
                    <tr key={position.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-200">
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {position.instrument?.symbol || position.instrumentId}
                        </div>
                        <div className={`text-xs font-semibold mt-0.5 ${
                          position.side === 'buy' 
                            ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10 px-2 py-0.5 rounded inline-block' 
                            : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10 px-2 py-0.5 rounded inline-block'
                        }`}>
                          {position.side.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">{position.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">
                        {position.averageEntryPrice != null
                          ? (typeof position.averageEntryPrice === 'string' 
                              ? parseFloat(position.averageEntryPrice) 
                              : position.averageEntryPrice).toFixed(position.instrument?.pricePrecision || 5)
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-medium">
                        {position.currentPrice != null
                          ? (typeof position.currentPrice === 'string'
                              ? parseFloat(position.currentPrice)
                              : position.currentPrice).toFixed(position.instrument?.pricePrecision || 5)
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 text-xs">
                        {position.takeProfitPrice != null
                          ? `TP: ${(typeof position.takeProfitPrice === 'string' ? parseFloat(position.takeProfitPrice) : position.takeProfitPrice).toFixed(position.instrument?.pricePrecision || 5)}`
                          : ''}
                        {position.stopLossPrice != null
                          ? ` SL: ${(typeof position.stopLossPrice === 'string' ? parseFloat(position.stopLossPrice) : position.stopLossPrice).toFixed(position.instrument?.pricePrecision || 5)}`
                          : ''}
                        {!position.takeProfitPrice && !position.stopLossPrice && '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 text-xs">
                        {format(new Date(position.openedAt), 'dd.MM.yyyy HH:mm:ss')}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                        {position.swapAccrued != null
                          ? (typeof position.swapAccrued === 'string'
                              ? parseFloat(position.swapAccrued)
                              : position.swapAccrued).toFixed(2)
                          : '0.00'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">0.00</td>
                      <td className="px-4 py-3 text-right">
                        <div className={`font-bold ${pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                        </div>
                        <div className={`text-xs font-semibold ${pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(0)}%
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleClosePosition(position.id)}
                          disabled={loading}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 px-3 py-1.5 bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 rounded transition-all duration-200 font-semibold"
                          title="Close position"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'closed' && (
          <div className="p-8 text-center text-slate-500">
            Closed positions will appear here
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="p-8 text-center text-slate-500">
            Pending orders will appear here
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="p-8 text-center text-slate-500">
            Finance history will appear here
          </div>
        )}
      </div>
    </div>
  );
}
