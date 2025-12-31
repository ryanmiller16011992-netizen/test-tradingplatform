import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('positions')
@UseGuards(JwtAuthGuard)
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Get()
  async getOpenPositions(@Request() req: any) {
    return this.positionsService.getOpenPositions(req.user.accountId);
  }

  @Post(':id/close')
  async closePosition(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { quantity?: number },
  ) {
    return this.positionsService.closePosition(req.user.accountId, id, body.quantity);
  }
}


