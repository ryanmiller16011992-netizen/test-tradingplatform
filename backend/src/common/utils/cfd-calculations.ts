import { Instrument } from '../entities/instrument.entity';
import { OrderSide } from '../types';

/**
 * Calculate unrealized PnL for a CFD position
 * Formula: (MarkPrice - EntryPrice) * PositionUnits * ContractSize
 * For sell positions, invert the sign
 */
export function calculateUnrealizedPnl(
  side: string,
  entryPrice: number,
  markPrice: number,
  quantity: number,
  contractSize: number,
): number {
  const priceDiff = side === 'buy' 
    ? markPrice - entryPrice 
    : entryPrice - markPrice;
  
  return priceDiff * quantity * contractSize;
}

/**
 * Calculate required margin for a position
 * Formula: NotionalValue / Leverage
 * NotionalValue = MarkPrice * PositionUnits * ContractSize
 */
export function calculateRequiredMargin(
  markPrice: number,
  quantity: number,
  contractSize: number,
  leverage: number,
): number {
  const notionalValue = markPrice * quantity * contractSize;
  return notionalValue / leverage;
}

/**
 * Calculate notional value
 */
export function calculateNotionalValue(
  price: number,
  quantity: number,
  contractSize: number,
): number {
  return price * quantity * contractSize;
}

/**
 * Get leverage for an instrument based on account leverage profile
 */
export function getLeverageForInstrument(
  instrument: Instrument,
  leverageProfile: Record<string, number>,
): number {
  // If margin rate is set, calculate leverage from it
  if (instrument.marginRate) {
    return 1 / instrument.marginRate;
  }
  
  // Otherwise use leverage from instrument or account profile
  if (instrument.leverage) {
    return instrument.leverage;
  }
  
  // Fall back to account leverage profile
  const assetClassLeverage = leverageProfile[instrument.assetClass];
  if (assetClassLeverage) {
    return assetClassLeverage;
  }
  
  // Default leverage
  return 100;
}

/**
 * Calculate swap (overnight financing) for a position
 * Formula: NotionalValue * SwapRate / 365
 */
export function calculateSwap(
  notionalValue: number,
  swapRate: number,
  days: number = 1,
): number {
  return (notionalValue * swapRate * days) / 365;
}

/**
 * Calculate spread cost (implicit fee)
 */
export function calculateSpreadCost(
  bid: number,
  ask: number,
  quantity: number,
  contractSize: number,
  side: string,
): number {
  const spread = ask - bid;
  return spread * quantity * contractSize;
}

/**
 * Round price to instrument precision
 */
export function roundPrice(price: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Math.round(price * factor) / factor;
}

/**
 * Round lot size to instrument lot step
 */
export function roundLotSize(quantity: number, lotStep: number): number {
  return Math.round(quantity / lotStep) * lotStep;
}

