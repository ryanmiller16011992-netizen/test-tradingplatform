import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Candle } from '../common/entities/candle.entity';
import { PriceEngineService } from './price-engine.service';
import { PriceTick } from '../common/types';

@Injectable()
export class MarketDataService {
  constructor(
    @InjectRepository(Candle)
    private candleRepository: Repository<Candle>,
    private priceEngine: PriceEngineService,
  ) {}

  getCurrentPrices(symbols?: string[]): PriceTick[] {
    if (symbols && symbols.length > 0) {
      return this.priceEngine.subscribeToPrices(symbols);
    }
    return this.priceEngine.getAllPrices();
  }

  getCurrentPrice(instrumentId: string): PriceTick | undefined {
    return this.priceEngine.getCurrentPrice(instrumentId);
  }

  async getCandles(
    instrumentId: string,
    timeframe: string,
    from: Date,
    to: Date,
  ): Promise<Candle[]> {
    return this.candleRepository.find({
      where: {
        instrumentId,
        timeframe,
        openTime: Between(from, to),
      },
      order: {
        openTime: 'ASC',
      },
    });
  }
}


