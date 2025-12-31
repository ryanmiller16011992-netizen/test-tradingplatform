import { create } from 'zustand';
import { PriceTick } from '@/types';

interface MarketState {
  prices: Map<string, PriceTick>;
  subscribedSymbols: string[];
  setPrices: (prices: PriceTick[]) => void;
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  prices: new Map(),
  subscribedSymbols: [],
  setPrices: (prices) => {
    const priceMap = new Map();
    prices.forEach((price) => {
      priceMap.set(price.symbol, price);
    });
    set({ prices: priceMap });
  },
  subscribe: (symbols) => {
    set({ subscribedSymbols: symbols });
  },
  unsubscribe: (symbols) => {
    const current = get().subscribedSymbols;
    set({ subscribedSymbols: current.filter((s) => !symbols.includes(s)) });
  },
}));


