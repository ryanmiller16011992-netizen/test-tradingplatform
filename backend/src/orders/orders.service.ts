import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../common/entities/order.entity';
import { Instrument } from '../common/entities/instrument.entity';
import { Account } from '../common/entities/account.entity';
import { MarketDataService } from '../market-data/market-data.service';
import { PositionsService } from '../positions/positions.service';
import { LedgerService } from '../ledger/ledger.service';
import { CreateOrderDto } from '../common/types';
import { calculateSpreadCost, roundLotSize, roundPrice } from '../common/utils/cfd-calculations';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Instrument)
    private instrumentRepository: Repository<Instrument>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private marketDataService: MarketDataService,
    private positionsService: PositionsService,
    private ledgerService: LedgerService,
  ) {}

  async createOrder(accountId: string, dto: CreateOrderDto): Promise<Order> {
    // Validate instrument
    const instrument = await this.instrumentRepository.findOne({
      where: { id: dto.instrumentId },
    });
    if (!instrument || !instrument.isActive) {
      throw new BadRequestException('Instrument not found or inactive');
    }

    // Validate account
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });
    if (!account) {
      throw new BadRequestException('Account not found');
    }

    // Validate quantity
    const roundedQuantity = roundLotSize(dto.quantity, instrument.lotStep);
    if (roundedQuantity < instrument.minLot) {
      throw new BadRequestException(`Minimum lot size is ${instrument.minLot}`);
    }

    // Get current price
    const currentPrice = this.marketDataService.getCurrentPrice(instrument.id);
    if (!currentPrice) {
      throw new BadRequestException('Price not available for instrument');
    }

    // Create order
    const order = this.orderRepository.create({
      accountId,
      instrumentId: dto.instrumentId,
      orderType: dto.orderType,
      side: dto.side,
      quantity: roundedQuantity,
      price: dto.price ? roundPrice(dto.price, instrument.pricePrecision) : undefined,
      stopPrice: dto.stopPrice ? roundPrice(dto.stopPrice, instrument.pricePrecision) : undefined,
      timeInForce: dto.timeInForce || 'GTC',
      expiresAt: dto.expiresAt,
      status: 'pending',
    });

    const savedOrder = await this.orderRepository.save(order);

    // Store TP/SL in order metadata for later use when position is created
    (savedOrder as any).takeProfitPrice = dto.takeProfitPrice;
    (savedOrder as any).stopLossPrice = dto.stopLossPrice;

    // Try to execute immediately if market order
    if (dto.orderType === 'market') {
      await this.processMarketOrder(savedOrder, instrument, currentPrice, dto.takeProfitPrice, dto.stopLossPrice);
    } else {
      // Set status to open for pending orders
      savedOrder.status = 'open';
      await this.orderRepository.save(savedOrder);
    }

    return savedOrder;
  }

  private async processMarketOrder(
    order: Order,
    instrument: Instrument,
    currentPrice: any,
    takeProfitPrice?: number,
    stopLossPrice?: number,
  ): Promise<void> {
    const fillPrice = order.side === 'buy' ? currentPrice.ask : currentPrice.bid;
    
    // Execute the order
    await this.executeOrder(order, instrument, fillPrice, order.quantity, takeProfitPrice, stopLossPrice);
  }

  async executeOrder(
    order: Order,
    instrument: Instrument,
    fillPrice: number,
    fillQuantity: number,
    takeProfitPrice?: number,
    stopLossPrice?: number,
  ): Promise<void> {
    // Update order
    order.filledQuantity += fillQuantity;
    if (!order.averageFillPrice) {
      order.averageFillPrice = fillPrice;
    } else {
      // Weighted average
      const totalValue = order.averageFillPrice * (order.filledQuantity - fillQuantity) +
                        fillPrice * fillQuantity;
      order.averageFillPrice = totalValue / order.filledQuantity;
    }

    if (order.filledQuantity >= order.quantity) {
      order.status = 'filled';
      order.filledAt = new Date();
    } else {
      order.status = 'partially_filled';
    }

    await this.orderRepository.save(order);

    // Create or update position
    await this.positionsService.updatePositionFromTrade(
      order.accountId,
      order.instrumentId,
      order.side,
      fillQuantity,
      fillPrice,
      order.id,
      takeProfitPrice,
      stopLossPrice,
    );

    // Get account balance for ledger entry
    const account = await this.accountRepository.findOne({
      where: { id: order.accountId },
    });
    const balanceAfter = account?.currentBalance || 0;

    // Record in ledger with metadata
    await this.ledgerService.createEntry({
      accountId: order.accountId,
      entryType: 'trade_open',
      amount: 0, // No balance change for opening
      balanceAfter,
      referenceId: order.id,
      referenceType: 'trade',
      description: `Trade opened: ${order.side} ${fillQuantity} ${instrument.symbol} @ ${fillPrice}`,
      metadata: {
        symbol: instrument.symbol,
        side: order.side,
        quantity: fillQuantity,
        price: fillPrice,
        instrumentId: instrument.id,
      },
    });
  }

  async cancelOrder(accountId: string, orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, accountId },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (order.status !== 'open' && order.status !== 'pending') {
      throw new BadRequestException('Cannot cancel order in current status');
    }

    order.status = 'canceled';
    return this.orderRepository.save(order);
  }

  async getOpenOrders(accountId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: {
        accountId,
        status: 'open',
      },
      relations: ['instrument'],
      order: { createdAt: 'DESC' },
    });
  }

  async getOrderHistory(accountId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { accountId },
      relations: ['instrument'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async processPendingOrders(): Promise<void> {
    // This would be called periodically to check pending limit/stop orders
    const pendingOrders = await this.orderRepository.find({
      where: { status: 'open' },
      relations: ['instrument'],
    });

    for (const order of pendingOrders) {
      const currentPrice = this.marketDataService.getCurrentPrice(order.instrumentId);
      if (!currentPrice) continue;

      // Check if limit order should fill
      if (order.orderType === 'limit') {
        const shouldFill = order.side === 'buy'
          ? currentPrice.ask <= order.price!
          : currentPrice.bid >= order.price!;

        if (shouldFill) {
          const fillPrice = order.price!;
          await this.executeOrder(order, order.instrument, fillPrice, order.quantity);
        }
      }

      // Check if stop order should trigger
      if (order.orderType === 'stop') {
        const shouldTrigger = order.side === 'buy'
          ? currentPrice.ask >= order.stopPrice!
          : currentPrice.bid <= order.stopPrice!;

        if (shouldTrigger) {
          const fillPrice = order.side === 'buy' ? currentPrice.ask : currentPrice.bid;
          await this.executeOrder(order, order.instrument, fillPrice, order.quantity);
        }
      }
    }
  }
}


