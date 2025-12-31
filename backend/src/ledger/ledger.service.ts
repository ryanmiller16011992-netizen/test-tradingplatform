import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LedgerEntry } from '../common/entities/ledger-entry.entity';

@Injectable()
export class LedgerService {
  constructor(
    @InjectRepository(LedgerEntry)
    private ledgerRepository: Repository<LedgerEntry>,
  ) {}

  async createEntry(data: {
    accountId: string;
    entryType: string;
    amount: number;
    balanceAfter: number;
    referenceId?: string;
    referenceType?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<LedgerEntry> {
    const entry = this.ledgerRepository.create({
      accountId: data.accountId,
      entryType: data.entryType,
      amount: data.amount,
      balanceAfter: data.balanceAfter,
      referenceId: data.referenceId,
      referenceType: data.referenceType,
      description: data.description,
      metadata: data.metadata || {},
    });

    return this.ledgerRepository.save(entry);
  }

  async getLedgerEntries(
    accountId: string,
    from?: Date,
    to?: Date,
  ): Promise<LedgerEntry[]> {
    const where: any = { accountId };
    
    if (from && to) {
      where.createdAt = Between(from, to);
    }

    return this.ledgerRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getStatement(accountId: string, from: Date, to: Date): Promise<LedgerEntry[]> {
    return this.getLedgerEntries(accountId, from, to);
  }
}

