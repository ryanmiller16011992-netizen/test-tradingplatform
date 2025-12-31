import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../common/entities/account.entity';
import { Position } from '../common/entities/position.entity';
import { Instrument } from '../common/entities/instrument.entity';
import { PositionsService } from '../positions/positions.service';
import { LedgerService } from '../ledger/ledger.service';
import { MarketDataService } from '../market-data/market-data.service';
import { AccountMetrics } from '../common/types';
import {
  calculateRequiredMargin,
  getLeverageForInstrument,
  calculateUnrealizedPnl,
} from '../common/utils/cfd-calculations';

@Injectable()
export class RiskService {
  private readonly MARGIN_CALL_LEVEL = 100; // 100%
  private readonly STOP_OUT_LEVEL = 50; // 50%

  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(Position)
    private positionRepository: Repository<Position>,
    @InjectRepository(Instrument)
    private instrumentRepository: Repository<Instrument>,
    private positionsService: PositionsService,
    private ledgerService: LedgerService,
    private marketDataService: MarketDataService,
  ) {}

  async calculateAccountMetrics(accountId: string): Promise<AccountMetrics> {
    try {
      const account = await this.accountRepository.findOne({
        where: { id: accountId },
      });

      if (!account) {
        throw new Error(`Account not found: ${accountId}`);
      }

      // Ensure leverageProfile exists
      if (!account.leverageProfile) {
        account.leverageProfile = {};
      }

      // Ensure balance values exist
      const currentBalance = account.currentBalance || 0;
      const startingBalance = account.startingBalance || currentBalance || 0;

      // Get all open positions
      const positions = await this.positionRepository.find({
        where: { accountId, closedAt: null },
        relations: ['instrument'],
      }).catch((error) => {
        console.error('Error fetching positions:', error);
        return [];
      });

      // Update position prices
      for (const position of positions) {
        try {
          if (position && position.instrumentId) {
            await this.positionsService.updatePositionPrice(position);
          }
        } catch (error) {
          console.error(`Error updating position ${position?.id}:`, error);
          // Continue with other positions
        }
      }

      // Calculate total unrealized PnL
      let totalUnrealizedPnl = 0;
      let totalUsedMargin = 0;

      for (const position of positions) {
        totalUnrealizedPnl += position.unrealizedPnl || 0;

        const instrument = position.instrument;
        if (!instrument) {
          console.error(`Position ${position.id} has no instrument`);
          continue;
        }
        
        const leverage = getLeverageForInstrument(instrument, account.leverageProfile);
        const currentPrice = position.currentPrice || position.averageEntryPrice;
        
        if (!currentPrice || currentPrice <= 0) {
          console.error(`Position ${position.id} has invalid price: ${currentPrice}`);
          continue;
        }
        
        const margin = calculateRequiredMargin(
          currentPrice,
          position.quantity,
          instrument.contractSize,
          leverage,
        );
        totalUsedMargin += margin;
      }

      // Calculate equity
      const equity = currentBalance + totalUnrealizedPnl;

      // Calculate free margin
      const freeMargin = equity - totalUsedMargin;

      // Calculate margin level
      const marginLevel = totalUsedMargin > 0
        ? (equity / totalUsedMargin) * 100
        : 0; // Return 0 when no margin is used (no positions)

      // Calculate drawdown (simplified - would need historical equity tracking)
      const drawdown = startingBalance - equity;
      const drawdownPercent = startingBalance > 0
        ? (drawdown / startingBalance) * 100
        : 0;

      return {
        accountId,
        balance: currentBalance,
        equity,
        usedMargin: totalUsedMargin,
        freeMargin,
        marginLevel,
        unrealizedPnl: totalUnrealizedPnl,
        realizedPnl: 0, // Would need to calculate from closed positions
        openPositions: positions.length,
        drawdown,
        drawdownPercent,
      };
    } catch (error) {
      console.error('Error calculating account metrics:', error);
      throw error;
    }
  }

  async checkRiskLevels(accountId: string): Promise<void> {
    const metrics = await this.calculateAccountMetrics(accountId);
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });

    if (!account) return;

    // Check for stop out
    if (metrics.marginLevel < this.STOP_OUT_LEVEL && metrics.marginLevel > 0) {
      await this.executeStopOut(accountId, metrics);
      account.accountState = 'liquidation';
      await this.accountRepository.save(account);
      return;
    }

    // Check for margin call
    if (metrics.marginLevel < this.MARGIN_CALL_LEVEL && metrics.marginLevel >= this.STOP_OUT_LEVEL) {
      if (account.accountState !== 'margin_call') {
        account.accountState = 'margin_call';
        await this.accountRepository.save(account);
      }
      return;
    }

    // Account is healthy
    if (account.accountState !== 'active') {
      account.accountState = 'active';
      await this.accountRepository.save(account);
    }
  }

  private async executeStopOut(
    accountId: string,
    metrics: AccountMetrics,
  ): Promise<void> {
    // Get all open positions sorted by worst PnL first
    const positions = await this.positionRepository.find({
      where: { accountId, closedAt: null },
      relations: ['instrument'],
      order: { unrealizedPnl: 'ASC' }, // Worst first
    });

    // Close positions until margin level recovers
    for (const position of positions) {
      await this.positionsService.closePosition(accountId, position.id);
      
      // Recalculate metrics
      const newMetrics = await this.calculateAccountMetrics(accountId);
      
      // If margin level recovered above stop out level, stop
      if (newMetrics.marginLevel >= this.STOP_OUT_LEVEL || newMetrics.marginLevel === 0) {
        break;
      }
    }

    // Record liquidation in ledger
    await this.ledgerService.createEntry({
      accountId,
      entryType: 'liquidation',
      amount: 0,
      balanceAfter: metrics.balance,
      description: 'Stop out executed - positions liquidated',
    });
  }

  async checkAllAccounts(): Promise<void> {
    const accounts = await this.accountRepository.find({
      where: { accountState: 'active' },
    });

    for (const account of accounts) {
      await this.checkRiskLevels(account.id);
    }
  }
}

