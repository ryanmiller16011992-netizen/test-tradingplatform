// Frontend types matching backend shared types

export interface PriceTick {
  instrumentId: string;
  symbol: string;
  bid: number;
  ask: number;
  mid: number;
  timestamp: Date;
}

export interface Instrument {
  id: string;
  symbol: string;
  name: string;
  assetClass: string;
  quoteCurrency: string;
  pricePrecision: number;
  minLot: number;
  lotStep: number;
  contractSize: number;
  leverage?: number;
  isActive: boolean;
}

export interface Position {
  id: string;
  instrumentId: string;
  instrument?: Instrument;
  side: string;
  quantity: number;
  averageEntryPrice: number;
  currentPrice?: number;
  unrealizedPnl: number;
  realizedPnl: number;
}

export interface Order {
  id: string;
  instrumentId: string;
  instrument?: Instrument;
  orderType: string;
  side: string;
  quantity: number;
  price?: number;
  status: string;
  createdAt: Date;
}

export interface AccountMetrics {
  accountId: string;
  balance: number;
  equity: number;
  usedMargin: number;
  freeMargin: number;
  marginLevel: number;
  unrealizedPnl: number;
  realizedPnl: number;
  openPositions: number;
  drawdown: number;
  drawdownPercent: number;
}


