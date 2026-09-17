import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShiftService } from './shift.service';
import { CreateShiftDto, UpdateShiftDto } from './dto/create-shift.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('shifts')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Get('next-shift-code')
  async getNextShiftCode(@Query('companyId') companyId?: string) {
    const nextShiftCode = await this.shiftService.generateNextShiftCode(companyId);
    return { nextShiftCode };
  }

  @Post()
  async create(@Body() createShiftDto: CreateShiftDto) {
    return this.shiftService.createShift(createShiftDto);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.shiftService.getAllShifts(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.shiftService.getShiftById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateShiftDto: UpdateShiftDto) {
    return this.shiftService.updateShift(id, updateShiftDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.shiftService.deleteShift(id);
  }
}
