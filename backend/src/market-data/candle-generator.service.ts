import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candle } from '../common/entities/candle.entity';
import { PriceTick } from '../common/types';

interface CandleBuffer {
  instrumentId: string;
  timeframe: string;
  open: number;
  high: number;
  low: number;
  close: number;
  openTime: Date;
  closeTime: Date;
}

@Injectable()
export class CandleGeneratorService {
  private candleBuffers: Map<string, CandleBuffer> = new Map();

  constructor(
    @InjectRepository(Candle)
    private candleRepository: Repository<Candle>,
  ) {}

  processTick(tick: PriceTick, timeframe: string = '1h'): void {
    const key = `${tick.instrumentId}_${timeframe}`;
    const now = new Date();
    
    // Get timeframe duration in milliseconds
    const timeframeMs = this.getTimeframeMs(timeframe);
    const candleStart = new Date(Math.floor(now.getTime() / timeframeMs) * timeframeMs);
    const candleEnd = new Date(candleStart.getTime() + timeframeMs);

    let buffer = this.candleBuffers.get(key);

    if (!buffer || buffer.closeTime <= now) {
      // Save previous candle if exists
      if (buffer) {
        this.saveCandle(buffer);
      }

      // Start new candle
      buffer = {
        instrumentId: tick.instrumentId,
        timeframe,
        open: tick.mid,
        high: tick.mid,
        low: tick.mid,
        close: tick.mid,
        openTime: candleStart,
        closeTime: candleEnd,
      };
      this.candleBuffers.set(key, buffer);
    } else {
      // Update existing candle
      buffer.high = Math.max(buffer.high, tick.mid);
      buffer.low = Math.min(buffer.low, tick.mid);
      buffer.close = tick.mid;
    }
  }

  private async saveCandle(buffer: CandleBuffer): Promise<void> {
    try {
      const candle = this.candleRepository.create({
        instrumentId: buffer.instrumentId,
        timeframe: buffer.timeframe,
        openTime: buffer.openTime,
        closeTime: buffer.closeTime,
        open: buffer.open,
        high: buffer.high,
        low: buffer.low,
        close: buffer.close,
        volume: 0,
      });

      await this.candleRepository.save(candle);
    } catch (error) {
      // Ignore duplicate key errors
      if (!error.message?.includes('duplicate')) {
        console.error('Failed to save candle:', error);
      }
    }
  }

  private getTimeframeMs(timeframe: string): number {
    const unit = timeframe.slice(-1);
    const value = parseInt(timeframe.slice(0, -1)) || 1;

    switch (unit) {
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 60 * 60 * 1000; // Default 1 hour
    }
  }

  async generateHistoricalCandles(
    instrumentId: string,
    timeframe: string,
    days: number = 30,
  ): Promise<void> {
    // Generate sample historical candles for chart display
    const timeframeMs = this.getTimeframeMs(timeframe);
    const candlesPerDay = (24 * 60 * 60 * 1000) / timeframeMs;
    const totalCandles = Math.floor(days * candlesPerDay);

    const now = new Date();
    const basePrice = 1.0; // Will be overridden by actual price

    for (let i = totalCandles; i >= 0; i--) {
      const closeTime = new Date(now.getTime() - i * timeframeMs);
      const openTime = new Date(closeTime.getTime() - timeframeMs);

      const change = (Math.random() - 0.5) * 0.02;
      const open = basePrice * (1 + change);
      const volatility = Math.random() * 0.01;
      const high = open * (1 + volatility);
      const low = open * (1 - volatility);
      const close = open + (Math.random() - 0.5) * volatility * 2;

      try {
        const candle = this.candleRepository.create({
          instrumentId,
          timeframe,
          openTime,
          closeTime,
          open,
          high,
          low,
          close,
          volume: Math.random() * 1000,
        });

        await this.candleRepository.save(candle);
      } catch (error) {
        // Ignore duplicates
      }
    }
  }
}


