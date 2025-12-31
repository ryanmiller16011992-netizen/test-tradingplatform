'use client';

import { useState, useEffect } from 'react';
import { Instrument, PriceTick } from '@/types';
import api from '@/lib/api';
import { getSocket } from '@/lib/websocket';

interface MarketWatchlistProps {
  onInstrumentSelect: (instrument: Instrument) => void;
  selectedInstrument?: Instrument;
}

export default function MarketWatchlist({ onInstrumentSelect, selectedInstrument }: MarketWatchlistProps) {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [prices, setPrices] = useState<Map<string, PriceTick>>(new Map());
  const [activeTab, setActiveTab] = useState<'fav' | 'all'>('fav');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        const response = await api.get('/instruments');
        setInstruments(response.data);
      } catch (error) {
        console.error('Failed to fetch instruments:', error);
      }
    };

    fetchInstruments();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const symbols = instruments.map(i => i.symbol);
    
    if (symbols.length > 0) {
      socket.emit('subscribe:prices', { symbols });
    }

    socket.on('prices', (priceUpdates: PriceTick[]) => {
      const priceMap = new Map();
      priceUpdates.forEach(price => {
        priceMap.set(price.symbol, price);
      });
      setPrices(prev => new Map([...prev, ...priceMap]));
    });

    return () => {
      socket.off('prices');
    };
  }, [instruments]);

  const filteredInstruments = instruments.filter(inst => {
    if (searchQuery) {
      return inst.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
             inst.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const calculateChange = (current: PriceTick | undefined, instrument: Instrument): number => {
    if (!current) return 0;
    // Simplified - in real app would compare with previous close
    return 0;
  };

  const getSpread = (price: PriceTick | undefined): number => {
    if (!price) return 0;
    return price.ask - price.bid;
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('fav')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'fav'
              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Fav
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'all'
              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          All Symbols
        </button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search symbols..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
      </div>

      {/* Instrument List */}
      <div className="flex-1 overflow-y-auto">
        <div className="text-xs text-gray-500 px-3 py-2 border-b border-gray-100 flex justify-between">
          <span>Symbol</span>
          <span>Price</span>
          <span>Change</span>
        </div>
        {filteredInstruments.map((instrument) => {
          const price = prices.get(instrument.symbol);
          const change = calculateChange(price, instrument);
          const isSelected = selectedInstrument?.id === instrument.id;

          return (
            <div
              key={instrument.id}
              onClick={() => onInstrumentSelect(instrument)}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">{instrument.symbol}</div>
                  <div className="text-xs text-gray-500">{instrument.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {price ? price.bid.toFixed(instrument.pricePrecision) : '-'}
                  </div>
                  <div className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                  </div>
                </div>
              </div>
              {price && (
                <div className="text-xs text-gray-400 mt-1">
                  Spread: {getSpread(price).toFixed(instrument.pricePrecision)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

