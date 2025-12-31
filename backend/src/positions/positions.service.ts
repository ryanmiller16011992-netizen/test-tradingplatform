import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from '../common/entities/position.entity';
import { Trade } from '../common/entities/trade.entity';
import { Instrument } from '../common/entities/instrument.entity';
import { Account } from '../common/entities/account.entity';
import { MarketDataService } from '../market-data/market-data.service';
import { LedgerService } from '../ledger/ledger.service';
import {
  calculateUnrealizedPnl,
  calculateRequiredMargin,
  getLeverageForInstrument,
  calculateSwap,
} from '../common/utils/cfd-calculations';

@Injectable()
export class PositionsService {
  constructor(
    @InjectRepository(Position)
    private positionRepository: Repository<Position>,
    @InjectRepository(Trade)
    private tradeRepository: Repository<Trade>,
    @InjectRepository(Instrument)
    private instrumentRepository: Repository<Instrument>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private marketDataService: MarketDataService,
    private ledgerService: LedgerService,
  ) {}

  async updatePositionFromTrade(
    accountId: string,
    instrumentId: string,
    side: string,
    quantity: number,
    price: number,
    orderId?: string,
    takeProfitPrice?: number,
    stopLossPrice?: number,
  ): Promise<Position> {
    // Find existing position
    let position = await this.positionRepository.findOne({
      where: {
        accountId,
        instrumentId,
        side,
        closedAt: null,
      },
      relations: ['instrument'],
    });

    const instrument = await this.instrumentRepository.findOne({
      where: { id: instrumentId },
    });

    if (!instrument) {
      throw new Error('Instrument not found');
    }

    if (position) {
      // Update existing position
      const totalQuantity = position.quantity + quantity;
      const totalValue = position.averageEntryPrice * position.quantity + price * quantity;
      position.averageEntryPrice = totalValue / totalQuantity;
      position.quantity = totalQuantity;
    } else {
      // Create new position
      position = this.positionRepository.create({
        accountId,
        instrumentId,
        side,
        quantity,
        averageEntryPrice: price,
        currentPrice: price,
        takeProfitPrice: takeProfitPrice,
        stopLossPrice: stopLossPrice,
      });
    }

    // Update current price and PnL
    const currentPrice = this.marketDataService.getCurrentPrice(instrumentId);
    if (currentPrice) {
      position.currentPrice = currentPrice.mid;
      position.unrealizedPnl = calculateUnrealizedPnl(
        position.side,
        position.averageEntryPrice,
        position.currentPrice,
        position.quantity,
        instrument.contractSize,
      );
    }

    const savedPosition = await this.positionRepository.save(position);

    // Create trade record
    const trade = this.tradeRepository.create({
      accountId,
      instrumentId,
      positionId: savedPosition.id,
      orderId,
      side,
      quantity,
      price,
      tradeType: 'open',
    });
    await this.tradeRepository.save(trade);

    // Record trade_open in ledger with position ID for matching
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });
    await this.ledgerService.createEntry({
      accountId,
      entryType: 'trade_open',
      amount: 0,
      balanceAfter: account?.currentBalance || 0,
      referenceId: savedPosition.id, // Use position ID for matching
      referenceType: 'trade',
      description: `Trade opened: ${side} ${quantity} ${instrument.symbol} @ ${price}`,
      metadata: {
        symbol: instrument.symbol,
        side,
        quantity,
        price,
        instrumentId: instrument.id,
        positionId: savedPosition.id,
      },
    });

    return savedPosition;
  }

  async closePosition(
    accountId: string,
    positionId: string,
    quantity?: number,
  ): Promise<Position> {
    const position = await this.positionRepository.findOne({
      where: { id: positionId, accountId },
      relations: ['instrument'],
    });

    if (!position || position.closedAt) {
      throw new Error('Position not found or already closed');
    }

    const instrument = position.instrument;
    const closeQuantity = quantity || position.quantity;
    const currentPrice = this.marketDataService.getCurrentPrice(instrument.id);
    
    if (!currentPrice) {
      throw new Error('Price not available');
    }

    const closePrice = position.side === 'buy' ? currentPrice.bid : currentPrice.ask;
    
    // Calculate realized PnL
    const realizedPnl = calculateUnrealizedPnl(
      position.side,
      position.averageEntryPrice,
      closePrice,
      closeQuantity,
      instrument.contractSize,
    );

    // Update position
    if (closeQuantity >= position.quantity) {
      // Full close
      position.quantity = 0;
      position.closedAt = new Date();
      position.realizedPnl += realizedPnl;
    } else {
      // Partial close
      position.quantity -= closeQuantity;
      position.realizedPnl += realizedPnl;
    }

    const savedPosition = await this.positionRepository.save(position);

    // Create trade record
    const trade = this.tradeRepository.create({
      accountId,
      instrumentId: instrument.id,
      positionId: savedPosition.id,
      side: position.side === 'buy' ? 'sell' : 'buy',
      quantity: closeQuantity,
      price: closePrice,
      realizedPnl,
      tradeType: closeQuantity >= position.quantity ? 'close' : 'partial_close',
    });
    await this.tradeRepository.save(trade);

    // Update account balance
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });
    if (account) {
      account.currentBalance += realizedPnl;
      await this.accountRepository.save(account);
    }

    // Record in ledger with metadata
    await this.ledgerService.createEntry({
      accountId,
      entryType: 'trade_close',
      amount: realizedPnl,
      balanceAfter: account!.currentBalance,
      referenceId: savedPosition.id,
      referenceType: 'trade',
      description: `Trade closed: ${closeQuantity} ${instrument.symbol} @ ${closePrice}, PnL: ${realizedPnl}`,
      metadata: {
        symbol: instrument.symbol,
        side: position.side,
        quantity: closeQuantity,
        price: closePrice,
        realizedPnl,
        entryPrice: position.averageEntryPrice,
        instrumentId: instrument.id,
      },
    });

    return savedPosition;
  }

  async getOpenPositions(accountId: string): Promise<Position[]> {
    const positions = await this.positionRepository.find({
      where: {
        accountId,
        closedAt: null,
      },
      relations: ['instrument'],
    });

    // Update prices and PnL
    for (const position of positions) {
      await this.updatePositionPrice(position);
    }

    return positions;
  }

  async updatePositionPrice(position: Position): Promise<void> {
    const currentPrice = this.marketDataService.getCurrentPrice(position.instrumentId);
    if (!currentPrice) return;

    const instrument = await this.instrumentRepository.findOne({
      where: { id: position.instrumentId },
    });
    if (!instrument) return;

    position.currentPrice = currentPrice.mid;
    position.unrealizedPnl = calculateUnrealizedPnl(
      position.side,
      position.averageEntryPrice,
      position.currentPrice,
      position.quantity,
      instrument.contractSize,
    );

    await this.positionRepository.save(position);
  }

  async updateAllPositions(): Promise<void> {
    const positions = await this.positionRepository.find({
      where: { closedAt: null },
      relations: ['instrument'],
    });

    for (const position of positions) {
      await this.updatePositionPrice(position);
    }
  }
}


