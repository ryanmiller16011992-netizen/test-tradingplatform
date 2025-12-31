import { Controller, Get, Post, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async getAccount(@Request() req: any) {
    return this.accountsService.getAccount(req.user.accountId);
  }

  @Get('metrics')
  async getAccountMetrics(@Request() req: any) {
    try {
      console.log('Account metrics request - User:', req.user);
      if (!req.user) {
        console.error('No user in request');
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }
      if (!req.user.accountId) {
        console.error('No accountId in user object:', req.user);
        throw new HttpException('User account not found', HttpStatus.UNAUTHORIZED);
      }
      console.log('Fetching metrics for accountId:', req.user.accountId);
      const metrics = await this.accountsService.getAccountMetrics(req.user.accountId);
      console.log('Metrics fetched successfully:', metrics);
      return metrics;
    } catch (error) {
      console.error('Error getting account metrics:', error);
      console.error('Error stack:', error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to get account metrics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('reset')
  async resetAccount(
    @Request() req: any,
    @Body() body: { balance?: number },
  ) {
    return this.accountsService.resetAccount(req.user.accountId, body.balance);
  }
}


