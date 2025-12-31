import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from '../common/types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.accountId, dto);
  }

  @Post(':id/cancel')
  async cancelOrder(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.cancelOrder(req.user.accountId, id);
  }

  @Get('open')
  async getOpenOrders(@Request() req: any) {
    return this.ordersService.getOpenOrders(req.user.accountId);
  }

  @Get('history')
  async getOrderHistory(@Request() req: any) {
    return this.ordersService.getOrderHistory(req.user.accountId);
  }
}


