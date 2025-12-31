import { Controller, Get, Query, Param } from '@nestjs/common';
import { MarketDataService } from './market-data.service';

@Controller('market')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Get('prices')
  getCurrentPrices(@Query('symbols') symbols?: string) {
    const symbolList = symbols ? symbols.split(',') : undefined;
    return this.marketDataService.getCurrentPrices(symbolList);
  }

  @Get('candles/:instrumentId')
  async getCandles(
    @Param('instrumentId') instrumentId: string,
    @Query('timeframe') timeframe: string = '1h',
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.marketDataService.getCandles(
      instrumentId,
      timeframe,
      new Date(from),
      new Date(to),
    );
  }
}


