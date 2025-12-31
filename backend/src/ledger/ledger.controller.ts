import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ledger')
@UseGuards(JwtAuthGuard)
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
  async getLedgerEntries(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.ledgerService.getLedgerEntries(
      req.user.accountId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('statement')
  async getStatement(
    @Request() req: any,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.ledgerService.getStatement(
      req.user.accountId,
      new Date(from),
      new Date(to),
    );
  }
}


