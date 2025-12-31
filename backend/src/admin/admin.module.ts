import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Instrument } from '../common/entities/instrument.entity';
import { InstrumentsModule } from '../instruments/instruments.module';
import { MarketDataModule } from '../market-data/market-data.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Instrument]),
    InstrumentsModule,
    MarketDataModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}


