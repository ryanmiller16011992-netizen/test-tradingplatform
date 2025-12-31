import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../common/entities/account.entity';
import { RiskService } from '../risk/risk.service';
import { LedgerService } from '../ledger/ledger.service';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private riskService: RiskService,
    private ledgerService: LedgerService,
  ) {}

  async getAccount(accountId: string): Promise<Account> {
    return this.accountRepository.findOne({ where: { id: accountId } });
  }

  async getAccountMetrics(accountId: string) {
    return this.riskService.calculateAccountMetrics(accountId);
  }

  async resetAccount(accountId: string, newBalance?: number): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const resetBalance = newBalance || account.startingBalance;
    const balanceChange = resetBalance - account.currentBalance;

    account.currentBalance = resetBalance;
    account.accountState = 'active';
    await this.accountRepository.save(account);

    // Record adjustment in ledger
    await this.ledgerService.createEntry({
      accountId,
      entryType: 'adjustment',
      amount: balanceChange,
      balanceAfter: resetBalance,
      description: `Account reset to ${resetBalance}`,
    });

    return account;
  }
}


