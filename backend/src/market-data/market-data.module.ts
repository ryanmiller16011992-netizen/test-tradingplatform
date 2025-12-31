import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { PriceEngineService } from './price-engine.service';
import { CandleGeneratorService } from './candle-generator.service';
import { Instrument } from '../common/entities/instrument.entity';
import { Candle } from '../common/entities/candle.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Instrument, Candle]),
    EventEmitterModule,
  ],
  controllers: [MarketDataController],
  providers: [MarketDataService, PriceEngineService, CandleGeneratorService],
  exports: [MarketDataService, PriceEngineService, CandleGeneratorService],
})
export class MarketDataModule {}

