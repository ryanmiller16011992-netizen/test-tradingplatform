import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';
import { Position } from '../common/entities/position.entity';
import { Trade } from '../common/entities/trade.entity';
import { Instrument } from '../common/entities/instrument.entity';
import { Account } from '../common/entities/account.entity';
import { MarketDataModule } from '../market-data/market-data.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Position, Trade, Instrument, Account]),
    MarketDataModule,
    LedgerModule,
  ],
  controllers: [PositionsController],
  providers: [PositionsService],
  exports: [PositionsService],
})
export class PositionsModule {}


