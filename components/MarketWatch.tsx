'use client';

import { useState, useEffect } from 'react';
import { Instrument, PriceTick } from '@/types';
import api from '@/lib/api';
import { getSocket } from '@/lib/websocket';

interface MarketWatchProps {
  onInstrumentSelect: (instrument: Instrument) => void;
  selectedInstrument: Instrument | null;
}

type Category = 'fx' | 'crypto' | 'stocks' | 'indices' | 'metals' | 'popular';

export default function MarketWatch({ onInstrumentSelect, selectedInstrument }: MarketWatchProps) {
  const [activeTab, setActiveTab] = useState<'fav' | 'movers' | 'all'>('all');
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [prices, setPrices] = useState<Map<string, PriceTick>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<Category>>(new Set(['fx', 'crypto', 'stocks', 'indices', 'metals']));

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteInstruments');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: Set<string>) => {
    localStorage.setItem('favoriteInstruments', JSON.stringify(Array.from(newFavorites)));
    setFavorites(newFavorites);
  };

  const toggleFavorite = (instrumentId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent instrument selection
    const newFavorites = new Set(favorites);
    if (newFavorites.has(instrumentId)) {
      newFavorites.delete(instrumentId);
    } else {
      newFavorites.add(instrumentId);
    }
    saveFavorites(newFavorites);
  };

  // Define getPriceChange before it's used
  const getPriceChange = (symbol: string) => {
    const price = prices.get(symbol);
    if (!price) return null;
    // Calculate 24h change (simplified - would need historical data)
    const change = ((price.mid - price.mid * 0.99) / price.mid) * 100;
    return change;
  };

  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        const response = await api.get('/instruments');
        setInstruments(response.data);
        
        // Subscribe to prices
        const symbols = response.data.map((i: Instrument) => i.symbol);
        const socket = getSocket();
        
        // Wait for socket to connect
        if (socket.connected) {
          socket.emit('subscribe:prices', { symbols });
        } else {
          socket.once('connect', () => {
            socket.emit('subscribe:prices', { symbols });
          });
        }
        
        const handlePrices = (priceUpdates: PriceTick[]) => {
          const priceMap = new Map();
          priceUpdates.forEach(price => {
            priceMap.set(price.symbol, price);
          });
          setPrices(prev => new Map([...prev, ...priceMap]));
        };
        
        socket.on('prices', handlePrices);

        return () => {
          socket.off('prices', handlePrices);
        };
      } catch (error) {
        console.error('Failed to fetch instruments:', error);
      }
    };

    fetchInstruments();
  }, []);

  // Group instruments by category
  const groupedInstruments = instruments.reduce((acc, inst) => {
    const category = inst.assetClass as Category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(inst);
    return acc;
  }, {} as Record<Category, Instrument[]>);

  // Get popular instruments (favorited or frequently traded)
  const popularInstruments = instruments.filter(inst => favorites.has(inst.id));

  // Category labels
  const categoryLabels: Record<Category, string> = {
    fx: 'FX',
    crypto: 'Crypto',
    stocks: 'Stocks',
    indices: 'Indices',
    metals: 'Commodities',
    popular: 'Popular',
  };

  const toggleCategory = (category: Category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const filteredInstruments = instruments.filter(inst => {
    // Filter by search query
    if (searchQuery) {
      const matchesSearch = inst.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           inst.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
    }

    // Filter by active tab
    if (activeTab === 'fav') {
      return favorites.has(inst.id);
    } else if (activeTab === 'movers') {
      // Show top movers (simplified - would need actual 24h change data)
      const price = prices.get(inst.symbol);
      if (!price) return false;
      const change = getPriceChange(inst.symbol);
      return change !== null && Math.abs(change) > 0.5; // Show instruments with >0.5% change
    }
    
    return true; // 'all' tab
  });

  // Render instrument item - clearer design
  const renderInstrument = (instrument: Instrument) => {
    const price = prices.get(instrument.symbol);
    const change = getPriceChange(instrument.symbol);
    const isSelected = selectedInstrument?.id === instrument.id;

    return (
      <div
        key={instrument.id}
        onClick={() => onInstrumentSelect(instrument)}
        className={`px-4 py-3 cursor-pointer transition-all duration-200 ${
          isSelected 
            ? 'bg-blue-50 dark:bg-gradient-to-r dark:from-blue-600/20 dark:to-indigo-600/20 border-l-2 border-blue-500' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800/30'
        }`}
      >
        <div className="flex justify-between items-center gap-3">
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <button
              onClick={(e) => toggleFavorite(instrument.id, e)}
              className="text-yellow-500 hover:text-yellow-400 transition-all duration-200 flex-shrink-0 p-0.5"
              title={favorites.has(instrument.id) ? 'Remove from favorites' : 'Add to favorites'}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <svg 
                className={`w-4 h-4 ${favorites.has(instrument.id) ? 'fill-current' : 'fill-none stroke-current stroke-1'}`}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-gray-900 dark:text-white truncate">{instrument.symbol}</div>
              {price && (
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                  Spread: {((price.ask - price.bid) * Math.pow(10, instrument.pricePrecision)).toFixed(0)}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            {price ? (
              <>
                <div className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  {price.mid.toFixed(instrument.pricePrecision)}
                </div>
                <div className={`text-xs font-bold w-16 text-right whitespace-nowrap px-2 py-1 rounded ${
                  change && change >= 0 
                    ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10' 
                    : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10'
                }`}>
                  {change ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '-'}
                </div>
              </>
            ) : (
              <div className="text-xs text-gray-400 dark:text-slate-600">-</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 flex-shrink-0 bg-gray-50 dark:bg-black">
        <button
          onClick={() => setActiveTab('fav')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'fav' 
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-black' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900'
          }`}
        >
          Fav
        </button>
        <button
          onClick={() => setActiveTab('movers')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'movers' 
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-black' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900'
          }`}
        >
          Top Movers
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'all' 
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-black' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900'
          }`}
        >
          All Symbols
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 bg-gray-50 dark:bg-black">
        <div className="relative">
          <input
            type="text"
            placeholder="Search symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
          />
        </div>
      </div>

      {/* Instrument List - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'all' ? (
          // Category-based view
          <div>
            {/* Popular Section */}
            {popularInstruments.length > 0 && (
              <div className="border-b border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => toggleCategory('popular')}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 text-left transition-all duration-200"
                >
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-200">
                    {categoryLabels.popular}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 dark:text-gray-500 bg-gray-100 dark:bg-black px-2 py-0.5 rounded font-medium">{popularInstruments.length}</span>
                    <svg
                      className={`w-4 h-4 text-gray-500 dark:text-gray-500 transition-all duration-200 ${
                        expandedCategories.has('popular') ? 'rotate-180 text-blue-500 dark:text-blue-400' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {expandedCategories.has('popular') && (
                  <div>
                    {popularInstruments
                      .filter(inst => !searchQuery || 
                        inst.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        inst.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map(inst => renderInstrument(inst))}
                  </div>
                )}
              </div>
            )}

            {/* Category Sections */}
            {(['fx', 'crypto', 'stocks', 'indices', 'metals'] as Category[]).map((category) => {
              const categoryInstruments = groupedInstruments[category] || [];
              if (categoryInstruments.length === 0) return null;

              const filteredCategoryInstruments = categoryInstruments.filter(inst => 
                !searchQuery || 
                inst.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                inst.name.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (filteredCategoryInstruments.length === 0 && searchQuery) return null;

              return (
                <div key={category} className="border-b border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 text-left transition-all duration-200"
                  >
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-200">
                      {categoryLabels[category]}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 dark:text-gray-500 bg-gray-100 dark:bg-black px-2 py-0.5 rounded font-medium">{categoryInstruments.length}</span>
                      <svg
                        className={`w-4 h-4 text-gray-500 dark:text-gray-500 transition-all duration-200 ${
                          expandedCategories.has(category) ? 'rotate-180 text-blue-500 dark:text-blue-400' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {expandedCategories.has(category) && (
                    <div>
                      {filteredCategoryInstruments.map(inst => renderInstrument(inst))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Flat list for Fav and Top Movers tabs
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-500 px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex justify-between bg-gray-50 dark:bg-black font-semibold">
              <span>Symbol</span>
              <div className="flex gap-4">
                <span>Price</span>
                <span>Change 24H</span>
              </div>
            </div>
            {filteredInstruments.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-500 text-sm">
                {activeTab === 'fav' 
                  ? 'No favorites yet. Click the star icon to add instruments to favorites.'
                  : activeTab === 'movers'
                  ? 'No top movers found.'
                  : 'No instruments found.'}
              </div>
            ) : (
              filteredInstruments.map(inst => renderInstrument(inst))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

