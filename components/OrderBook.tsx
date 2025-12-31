'use client';

import { PriceTick } from '@/types';

interface OrderBookProps {
  currentPrice: PriceTick | null;
}

export default function OrderBook({ currentPrice }: OrderBookProps) {
  if (!currentPrice) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        Select an instrument to view order book
      </div>
    );
  }

  const pricePrecision = 5; // Default precision, could be passed as prop if needed

  // Generate sample order book data (in real app, this would come from WebSocket)
  const generateOrderBook = () => {
    const bids = [];
    const asks = [];
    const mid = currentPrice.mid;
    const spread = currentPrice.ask - currentPrice.bid;
    
    // Generate bid levels (below mid)
    for (let i = 0; i < 5; i++) {
      const price = mid - spread * (i + 1) * 0.5;
      const volume = [100000, 500000, 1000000, 3000000, 5000000][i];
      bids.push({ price, volume });
    }
    
    // Generate ask levels (above mid)
    for (let i = 0; i < 5; i++) {
      const price = mid + spread * (i + 1) * 0.5;
      const volume = [100000, 500000, 1000000, 3000000, 5000000][i];
      asks.push({ price, volume });
    }
    
    return { bids, asks };
  };

  const { bids, asks } = generateOrderBook();

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(0)}K`;
    return vol.toString();
  };

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <div className="text-sm font-semibold mb-3 text-gray-900">Order Book</div>
      <div className="grid grid-cols-2 gap-4 text-xs">
        {/* Bids (Buy side) */}
        <div>
          <div className="grid grid-cols-2 gap-2 mb-2 text-gray-600 font-medium">
            <div>Price</div>
            <div className="text-right">Volume</div>
          </div>
          {bids.map((bid, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-2 py-1 hover:bg-gray-50">
              <div className="text-red-600 font-medium">
                {bid.price.toFixed(pricePrecision)}
              </div>
              <div className="text-right text-gray-700">
                {formatVolume(bid.volume)}
              </div>
            </div>
          ))}
        </div>

        {/* Asks (Sell side) */}
        <div>
          <div className="grid grid-cols-2 gap-2 mb-2 text-gray-600 font-medium">
            <div>Price</div>
            <div className="text-right">Volume</div>
          </div>
          {asks.map((ask, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-2 py-1 hover:bg-gray-50">
              <div className="text-green-600 font-medium">
                {ask.price.toFixed(pricePrecision)}
              </div>
              <div className="text-right text-gray-700">
                {formatVolume(ask.volume)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


