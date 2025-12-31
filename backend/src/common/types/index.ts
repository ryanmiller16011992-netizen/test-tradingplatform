// Shared TypeScript types for CFD Trading Platform

export enum AssetClass {
  FX = 'fx',
  INDICES = 'indices',
  METALS = 'metals',
  CRYPTO = 'crypto',
  STOCKS = 'stocks',
}

export enum OrderType {
  MARKET = 'market',
  LIMIT = 'limit',
  STOP = 'stop',
  STOP_LIMIT = 'stop_limit',
}

export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell',
}

export enum OrderStatus {
  PENDING = 'pending',
  OPEN = 'open',
  PARTIALLY_FILLED = 'partially_filled',
  FILLED = 'filled',
  CANCELED = 'canceled',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum TimeInForce {
  GTC = 'GTC',
  IOC = 'IOC',
  FOK = 'FOK',
  DAY = 'DAY',
}

export enum AccountState {
  ACTIVE = 'active',
  MARGIN_CALL = 'margin_call',
  LIQUIDATION = 'liquidation',
}

export enum LedgerEntryType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRADE_OPEN = 'trade_open',
  TRADE_CLOSE = 'trade_close',
  COMMISSION = 'commission',
  SWAP = 'swap',
  ADJUSTMENT = 'adjustment',
  LIQUIDATION = 'liquidation',
}

export enum TradeType {
  OPEN = 'open',
  CLOSE = 'close',
  PARTIAL_CLOSE = 'partial_close',
}

export enum SimulationMode {
  SYNTHETIC = 'synthetic',
  HISTORICAL_REPLAY = 'historical_replay',
}

export interface LeverageProfile {
  fx?: number;
  indices?: number;
  metals?: number;
  crypto?: number;
  stocks?: number;
}

export interface Instrument {
  id: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  quoteCurrency: string;
  pricePrecision: number;
  minLot: number;
  lotStep: number;
  contractSize: number;
  marginRate?: number;
  leverage?: number;
  swapLongRate: number;
  swapShortRate: number;
  spreadModel: string;
  spreadConfig: Record<string, any>;
  tradingHours: Record<string, any>;
  commissionPerLot: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceTick {
  instrumentId: string;
  symbol: string;
  bid: number;
  ask: number;
  mid: number;
  timestamp: Date;
}

export interface Candle {
  instrumentId: string;
  timeframe: string;
  openTime: Date;
  closeTime: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Order {
  id: string;
  accountId: string;
  instrumentId: string;
  instrument?: Instrument;
  orderType: OrderType;
  side: OrderSide;
  quantity: number;
  price?: number;
  stopPrice?: number;
  status: OrderStatus;
  filledQuantity: number;
  averageFillPrice?: number;
  timeInForce: TimeInForce;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  filledAt?: Date;
}

export interface Position {
  id: string;
  accountId: string;
  instrumentId: string;
  instrument?: Instrument;
  side: OrderSide;
  quantity: number;
  averageEntryPrice: number;
  currentPrice?: number;
  unrealizedPnl: number;
  realizedPnl: number;
  swapAccrued: number;
  takeProfitPrice?: number;
  stopLossPrice?: number;
  trailingStopDistance?: number;
  openedAt: Date;
  closedAt?: Date;
  updatedAt: Date;
}

export interface Trade {
  id: string;
  accountId: string;
  instrumentId: string;
  instrument?: Instrument;
  positionId?: string;
  orderId?: string;
  side: OrderSide;
  quantity: number;
  price: number;
  commission: number;
  swap: number;
  realizedPnl: number;
  tradeType: TradeType;
  executedAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  baseCurrency: string;
  startingBalance: number;
  currentBalance: number;
  accountState: AccountState;
  leverageProfile: LeverageProfile;
  createdAt: Date;
  updatedAt: Date;
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

export interface LedgerEntry {
  id: string;
  accountId: string;
  entryType: LedgerEntryType;
  amount: number;
  balanceAfter: number;
  referenceId?: string;
  referenceType?: string;
  description?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  kycStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderDto {
  instrumentId: string;
  orderType: OrderType;
  side: OrderSide;
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: TimeInForce;
  expiresAt?: Date;
  takeProfitPrice?: number;
  stopLossPrice?: number;
  trailingStopDistance?: number;
}

export interface MarketDataSubscription {
  symbols: string[];
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
}


