import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiskService } from './risk.service';
import { Account } from '../common/entities/account.entity';
import { Position } from '../common/entities/position.entity';
import { Instrument } from '../common/entities/instrument.entity';
import { PositionsModule } from '../positions/positions.module';
import { LedgerModule } from '../ledger/ledger.module';
import { MarketDataModule } from '../market-data/market-data.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Position, Instrument]),
    PositionsModule,
    LedgerModule,
    MarketDataModule,
  ],
  providers: [RiskService],
  exports: [RiskService],
})
export class RiskModule {}

