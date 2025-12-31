import { Injectable } from '@nestjs/common';
import { InstrumentsService } from '../instruments/instruments.service';
import { MarketDataService } from '../market-data/market-data.service';

@Injectable()
export class AdminService {
  constructor(
    private instrumentsService: InstrumentsService,
    private marketDataService: MarketDataService,
  ) {}

  async seedInstruments() {
    return this.instrumentsService.seedDefaultInstruments();
  }
}


