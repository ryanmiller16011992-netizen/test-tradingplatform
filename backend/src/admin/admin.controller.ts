import { Controller, Post } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('seed-instruments')
  async seedInstruments() {
    await this.adminService.seedInstruments();
    return { message: 'Instruments seeded successfully' };
  }
}


