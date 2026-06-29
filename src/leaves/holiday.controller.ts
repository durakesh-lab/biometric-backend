import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { HolidayService } from "./holiday.service";
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// holiday.controller.ts
@UseGuards(JwtAuthGuard)
@Controller('holidays')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Post()
  create(@Body() dto: any) {
    return this.holidayService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.holidayService.update(id, dto);
  }

  @Get()
  findAll() {
    return this.holidayService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.holidayService.findOne(id);
  }
}
