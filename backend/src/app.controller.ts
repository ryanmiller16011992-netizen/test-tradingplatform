import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: 'CFD Trading Platform API',
      version: '1.0.0',
      endpoints: {
        auth: '/auth',
        account: '/account',
        instruments: '/instruments',
        marketData: '/market-data',
        orders: '/orders',
        positions: '/positions',
        ledger: '/ledger',
        admin: '/admin',
      },
      frontend: process.env.CORS_ORIGIN || 'http://localhost:3002',
    };
  }

  @Get('health')
  health() {
    // Immediate response for Railway health check
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      port: process.env.PORT || 3001,
    };
  }
}

