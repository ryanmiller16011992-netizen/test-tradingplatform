import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from '../common/entities/order.entity';
import { Instrument } from '../common/entities/instrument.entity';
import { Account } from '../common/entities/account.entity';
import { MarketDataModule } from '../market-data/market-data.module';
import { PositionsModule } from '../positions/positions.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Instrument, Account]),
    MarketDataModule,
    PositionsModule,
    LedgerModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}


