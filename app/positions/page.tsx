'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { Position } from '@/types';

export default function PositionsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

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
  }, [user, router]);

  const handleClosePosition = async (positionId: string) => {
    if (!confirm('Are you sure you want to close this position?')) return;

    setLoading(true);
    try {
      await api.post(`/positions/${positionId}/close`);
      const response = await api.get('/positions');
      setPositions(response.data);
      alert('Position closed successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to close position');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <button onClick={() => router.push('/dashboard')} className="text-blue-600">
          ← Back to Dashboard
        </button>
        <h1 className="text-xl font-bold">Open Positions</h1>
        <div></div>
      </nav>

      <div className="container mx-auto p-6">
        {positions.length === 0 ? (
          <div className="trading-card text-center py-12">
            <p className="text-gray-600">No open positions</p>
            <button
              onClick={() => router.push('/trading')}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Start Trading
            </button>
          </div>
        ) : (
          <div className="trading-card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Symbol</th>
                  <th className="text-left p-3">Side</th>
                  <th className="text-right p-3">Quantity</th>
                  <th className="text-right p-3">Entry Price</th>
                  <th className="text-right p-3">Current Price</th>
                  <th className="text-right p-3">Unrealized P&L</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {positions.map(position => (
                  <tr key={position.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold">
                      {position.instrument?.symbol || position.instrumentId}
                    </td>
                    <td className={`p-3 font-semibold ${
                      position.side === 'buy' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {position.side.toUpperCase()}
                    </td>
                    <td className="p-3 text-right">{position.quantity}</td>
                    <td className="p-3 text-right">
                      {position.averageEntryPrice.toFixed(position.instrument?.pricePrecision || 5)}
                    </td>
                    <td className="p-3 text-right">
                      {position.currentPrice?.toFixed(position.instrument?.pricePrecision || 5) || '-'}
                    </td>
                    <td className={`p-3 text-right font-semibold ${
                      position.unrealizedPnl >= 0 ? 'profit' : 'loss'
                    }`}>
                      ${position.unrealizedPnl.toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleClosePosition(position.id)}
                        disabled={loading}
                        className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


