import { Controller, Get, Param } from '@nestjs/common';
import { InstrumentsService } from './instruments.service';

@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

  @Get()
  async findAll() {
    return this.instrumentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.instrumentsService.findOne(id);
  }
}


