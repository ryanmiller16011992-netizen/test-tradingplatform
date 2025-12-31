import {Module} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {TypeOrmModule} from '@nestjs/typeorm';
import {EventEmitterModule} from '@nestjs/event-emitter';
import {AppController} from './app.controller';
import {AuthModule} from './auth/auth.module';
import {AccountsModule} from './accounts/accounts.module';
import {InstrumentsModule} from './instruments/instruments.module';
import {MarketDataModule} from './market-data/market-data.module';
import {OrdersModule} from './orders/orders.module';
import {PositionsModule} from './positions/positions.module';
import {RiskModule} from './risk/risk.module';
import {LedgerModule} from './ledger/ledger.module';
import {WebSocketModule} from './websocket/websocket.module';
import {AdminModule} from './admin/admin.module';

@Module({
    controllers: [AppController],
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        EventEmitterModule.forRoot(),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const isProduction = config.get('NODE_ENV') === 'production';

                const databaseUrl = isProduction ?
                    config.get < string > ('DATABASE_URL') :
                    config.get < string > ('DATABASE_PUBLIC_URL');

                if (!databaseUrl) {
                    throw new Error(
                        `Missing database URL. Expected ${
              isProduction ? 'DATABASE_URL' : 'DATABASE_PUBLIC_URL'
            }`,
                    );
                }

                if (!isProduction && databaseUrl.includes('railway.internal')) {
                    throw new Error(
                        'railway.internal cannot be used locally. Use DATABASE_PUBLIC_URL.',
                    );
                }

                console.log('🗄️ DB mode:', isProduction ? 'production' : 'development');
                console.log(
                    '🗄️ DB source:',
                    isProduction ? 'DATABASE_URL (Railway)' : 'DATABASE_PUBLIC_URL (Public)',
                );

                return {
                    type: 'postgres',
                    url: databaseUrl,
                    ssl: isProduction ? {
                        rejectUnauthorized: false
                    } : false,
                    autoLoadEntities: true,
                    synchronize: false,
                    logging: !isProduction,
                    retryAttempts: 5,
                    retryDelay: 5000,
                    extra: {
                        max: 10,
                        connectionTimeoutMillis: 30000,
                        idleTimeoutMillis: 30000,
                    },
                };
            },
        }),

        AuthModule,
        AccountsModule,
        InstrumentsModule,
        MarketDataModule,
        OrdersModule,
        PositionsModule,
        RiskModule,
        LedgerModule,
        WebSocketModule,
        AdminModule,
    ],
})
export class AppModule {}