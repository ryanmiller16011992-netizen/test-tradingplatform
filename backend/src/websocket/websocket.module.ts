import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MarketDataModule } from '../market-data/market-data.module';
import { RiskModule } from '../risk/risk.module';
import { OrdersModule } from '../orders/orders.module';
import { PositionsModule } from '../positions/positions.module';
import { TradingWebSocketGateway } from './websocket.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule,
    MarketDataModule, 
    RiskModule, 
    OrdersModule, 
    PositionsModule,
    AuthModule,
  ],
  providers: [TradingWebSocketGateway],
  exports: [TradingWebSocketGateway],
})
export class WebSocketModule {}

