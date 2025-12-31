import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { MarketDataService } from '../market-data/market-data.service';
import { RiskService } from '../risk/risk.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PriceTick } from '../common/types';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3002',
    credentials: true,
  },
})
export class TradingWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private clientSubscriptions: Map<string, Set<string>> = new Map(); // clientId -> Set of symbols
  private accountSubscriptions: Map<string, Set<string>> = new Map(); // accountId -> Set of clientIds

  constructor(
    private marketDataService: MarketDataService,
    private riskService: RiskService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Authenticate via JWT from query or auth header
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token as string, {
        secret: this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
      });

      client.data.accountId = payload.accountId;
      client.data.userId = payload.sub;

      // Track account subscriptions
      if (!this.accountSubscriptions.has(payload.accountId)) {
        this.accountSubscriptions.set(payload.accountId, new Set());
      }
      this.accountSubscriptions.get(payload.accountId)!.add(client.id);

      console.log(`Client connected: ${client.id}, Account: ${payload.accountId}`);
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const accountId = client.data.accountId;
    if (accountId && this.accountSubscriptions.has(accountId)) {
      this.accountSubscriptions.get(accountId)!.delete(client.id);
    }
    this.clientSubscriptions.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:prices')
  handleSubscribePrices(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { symbols: string[] },
  ) {
    if (!this.clientSubscriptions.has(client.id)) {
      this.clientSubscriptions.set(client.id, new Set());
    }
    
    const subscriptions = this.clientSubscriptions.get(client.id)!;
    data.symbols.forEach(symbol => subscriptions.add(symbol));

    // Send initial prices
    const prices = this.marketDataService.getCurrentPrices(data.symbols);
    client.emit('prices', prices);
  }

  @SubscribeMessage('unsubscribe:prices')
  handleUnsubscribePrices(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { symbols: string[] },
  ) {
    const subscriptions = this.clientSubscriptions.get(client.id);
    if (subscriptions) {
      data.symbols.forEach(symbol => subscriptions.delete(symbol));
    }
  }

  // Broadcast price updates to subscribed clients
  broadcastPrices(prices: any[]) {
    for (const [clientId, symbols] of this.clientSubscriptions.entries()) {
      const client = this.server.sockets.sockets.get(clientId);
      if (client) {
        const relevantPrices = prices.filter(p => symbols.has(p.symbol));
        if (relevantPrices.length > 0) {
          client.emit('prices', relevantPrices);
        }
      }
    }
  }

  // Broadcast account metrics to account subscribers
  broadcastAccountMetrics(accountId: string, metrics: any) {
    const clients = this.accountSubscriptions.get(accountId);
    if (clients) {
      clients.forEach(clientId => {
        const client = this.server.sockets.sockets.get(clientId);
        if (client) {
          client.emit('account:metrics', metrics);
        }
      });
    }
  }

  // Broadcast order updates
  broadcastOrderUpdate(accountId: string, order: any) {
    const clients = this.accountSubscriptions.get(accountId);
    if (clients) {
      clients.forEach(clientId => {
        const client = this.server.sockets.sockets.get(clientId);
        if (client) {
          client.emit('order:update', order);
        }
      });
    }
  }

  // Broadcast position updates
  broadcastPositionUpdate(accountId: string, position: any) {
    const clients = this.accountSubscriptions.get(accountId);
    if (clients) {
      clients.forEach(clientId => {
        const client = this.server.sockets.sockets.get(clientId);
        if (client) {
          client.emit('position:update', position);
        }
      });
    }
  }

  // Listen for price updates and broadcast to subscribed clients
  @OnEvent('price.update')
  handlePriceUpdate(tick: PriceTick) {
    // Broadcast to all clients subscribed to this symbol
    for (const [clientId, symbols] of this.clientSubscriptions.entries()) {
      if (symbols.has(tick.symbol)) {
        const client = this.server.sockets.sockets.get(clientId);
        if (client) {
          client.emit('prices', [tick]);
        }
      }
    }
  }
}

