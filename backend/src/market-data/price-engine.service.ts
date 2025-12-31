import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Instrument } from '../common/entities/instrument.entity';
import { PriceTick } from '../common/types';
import { CandleGeneratorService } from './candle-generator.service';

@Injectable()
export class PriceEngineService implements OnModuleInit {
  private priceStreams: Map<string, PriceTick> = new Map();
  private priceGenerators: Map<string, NodeJS.Timeout> = new Map();
  private basePrices: Map<string, number> = new Map();
  private seeds: Map<string, number> = new Map();

  constructor(
    @InjectRepository(Instrument)
    private instrumentRepository: Repository<Instrument>,
    private candleGenerator: CandleGeneratorService,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    try {
      // Wait a bit for database connection to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Initialize price streams for all active instruments
      const instruments = await this.instrumentRepository.find({
        where: { isActive: true },
      });

      console.log(`PriceEngine: Found ${instruments.length} active instruments`);

      for (const instrument of instruments) {
        try {
          await this.initializeInstrumentPrice(instrument);
        } catch (error) {
          console.error(`Failed to initialize price for ${instrument.symbol}:`, error.message);
          // Continue with other instruments even if one fails
        }
      }
    } catch (error) {
      console.error('PriceEngine initialization failed:', error.message);
      console.error('This is non-fatal - price engine will retry on next request');
      // Don't throw - allow app to start even if price engine fails
    }
  }

  private async initializeInstrumentPrice(instrument: Instrument) {
    // Set initial base price based on instrument type and symbol
    let basePrice = 1.0;
    
    // FX Major Pairs
    const fxPrices: Record<string, number> = {
      'EURUSD': 1.1000, 'GBPUSD': 1.2700, 'USDJPY': 150.00, 'USDCHF': 0.8800,
      'AUDUSD': 0.6700, 'NZDUSD': 0.6200, 'USDCAD': 1.3500,
      'EURGBP': 0.8650, 'EURJPY': 165.00, 'GBPJPY': 195.00,
      'GBPAUD': 2.0500, 'GBPCAD': 1.8500, 'GBPCHF': 1.1430, 'GBPNZD': 2.2530,
      'EURTRY': 41.18, 'NZDCAD': 0.8215,
    };
    
    // Indices
    const indicesPrices: Record<string, number> = {
      'US100': 18000, 'SPX500': 4500, 'US30': 39000, 'UK100': 7800,
      'GER40': 18000, 'FRA40': 7500, 'JPN225': 38000, 'AUS200': 7500,
    };
    
    // Metals
    const metalsPrices: Record<string, number> = {
      'XAUUSD': 2000, 'XAGUSD': 24.50, 'XPTUSD': 950, 'XPDUSD': 1200,
    };
    
    // Crypto
    const cryptoPrices: Record<string, number> = {
      'BTCUSD': 45000, 'ETHUSD': 2500, 'LTCUSD': 75, 'XRPUSD': 0.65,
    };
    
    // Stocks
    const stocksPrices: Record<string, number> = {
      'AAPL': 180, 'GOOGL': 140, 'MSFT': 380, 'TSLA': 250,
      'AMZN': 150, 'META': 480, 'NVDA': 500,
    };
    
    if (fxPrices[instrument.symbol]) {
      basePrice = fxPrices[instrument.symbol];
    } else if (indicesPrices[instrument.symbol]) {
      basePrice = indicesPrices[instrument.symbol];
    } else if (metalsPrices[instrument.symbol]) {
      basePrice = metalsPrices[instrument.symbol];
    } else if (cryptoPrices[instrument.symbol]) {
      basePrice = cryptoPrices[instrument.symbol];
    } else if (stocksPrices[instrument.symbol]) {
      basePrice = stocksPrices[instrument.symbol];
    } else {
      // Default based on asset class
      switch (instrument.assetClass) {
        case 'fx':
          basePrice = 1.0;
          break;
        case 'indices':
          basePrice = 10000;
          break;
        case 'metals':
          basePrice = 2000;
          break;
        case 'crypto':
          basePrice = 1000;
          break;
        case 'stocks':
          basePrice = 100;
          break;
        default:
          basePrice = 1.0;
      }
    }

    this.basePrices.set(instrument.id, basePrice);
    this.seeds.set(instrument.id, Math.random() * 1000);

    // Generate initial price
    const spread = this.getSpread(instrument);
    const mid = basePrice;
    const bid = mid - spread / 2;
    const ask = mid + spread / 2;

    const tick: PriceTick = {
      instrumentId: instrument.id,
      symbol: instrument.symbol,
      bid: this.roundPrice(bid, instrument.pricePrecision),
      ask: this.roundPrice(ask, instrument.pricePrecision),
      mid: this.roundPrice(mid, instrument.pricePrecision),
      timestamp: new Date(),
    };

    this.priceStreams.set(instrument.id, tick);

    // Generate initial historical candles for chart
    this.candleGenerator.generateHistoricalCandles(instrument.id, '1h', 7).catch(console.error);
    this.candleGenerator.generateHistoricalCandles(instrument.id, '4h', 30).catch(console.error);
    this.candleGenerator.generateHistoricalCandles(instrument.id, '1d', 90).catch(console.error);

    // Start price generation loop
    this.startPriceGeneration(instrument);
  }

  private startPriceGeneration(instrument: Instrument) {
    const interval = setInterval(() => {
      this.generateNextPrice(instrument);
    }, 1000); // Update every second

    this.priceGenerators.set(instrument.id, interval);
  }

  private generateNextPrice(instrument: Instrument) {
    const currentTick = this.priceStreams.get(instrument.id);
    if (!currentTick) return;

    const basePrice = this.basePrices.get(instrument.id) || 1.0;
    const seed = this.seeds.get(instrument.id) || 0;

    // Geometric Brownian Motion simulation
    const dt = 1 / 86400; // 1 second in days
    const volatility = this.getVolatility(instrument);
    const drift = 0.0001; // Small upward drift
    
    // Generate random walk
    const random = this.seededRandom(seed + Date.now());
    const change = drift * dt + volatility * Math.sqrt(dt) * (random - 0.5) * 2;
    
    // Update base price
    const newMid = currentTick.mid * (1 + change);
    this.basePrices.set(instrument.id, newMid);

    const spread = this.getSpread(instrument);
    const bid = newMid - spread / 2;
    const ask = newMid + spread / 2;

    const newTick: PriceTick = {
      instrumentId: instrument.id,
      symbol: instrument.symbol,
      bid: this.roundPrice(bid, instrument.pricePrecision),
      ask: this.roundPrice(ask, instrument.pricePrecision),
      mid: this.roundPrice(newMid, instrument.pricePrecision),
      timestamp: new Date(),
    };

    this.priceStreams.set(instrument.id, newTick);
    
    // Generate candles for different timeframes
    this.candleGenerator.processTick(newTick, '1m');
    this.candleGenerator.processTick(newTick, '5m');
    this.candleGenerator.processTick(newTick, '15m');
    this.candleGenerator.processTick(newTick, '1h');
    this.candleGenerator.processTick(newTick, '4h');
    this.candleGenerator.processTick(newTick, '1d');
    
    // Emit price update event for WebSocket
    this.eventEmitter.emit('price.update', newTick);
  }

  private getSpread(instrument: Instrument): number {
    const config = instrument.spreadConfig || {};
    if (instrument.spreadModel === 'fixed' && config.fixed) {
      return config.fixed;
    }
    // Default spreads
    switch (instrument.assetClass) {
      case 'fx':
        return 0.0002;
      case 'indices':
        return 2.0;
      case 'metals':
        return 0.5;
      case 'crypto':
        return 50;
      default:
        return 0.01;
    }
  }

  private getVolatility(instrument: Instrument): number {
    // Annualized volatility
    switch (instrument.assetClass) {
      case 'fx':
        return 0.10; // 10%
      case 'indices':
        return 0.15; // 15%
      case 'metals':
        return 0.20; // 20%
      case 'crypto':
        return 0.50; // 50%
      default:
        return 0.15;
    }
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  private roundPrice(price: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(price * factor) / factor;
  }

  getCurrentPrice(instrumentId: string): PriceTick | undefined {
    return this.priceStreams.get(instrumentId);
  }

  getAllPrices(): PriceTick[] {
    return Array.from(this.priceStreams.values());
  }

  subscribeToPrices(symbols: string[]): PriceTick[] {
    const prices: PriceTick[] = [];
    for (const tick of this.priceStreams.values()) {
      if (symbols.includes(tick.symbol)) {
        prices.push(tick);
      }
    }
    return prices;
  }
}

