import { Controller, Post, Put, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) { }

  // Pull punches from EasyWDMS (all devices, or one via body.deviceId).
  @Post('sync')
  sync(@Body() body: any) {
    return this.attendanceService.sync(body?.deviceId);
  }

  // Paginated punch log — body may scope by companyId/branchId; query has from/to/employeeId/search.
  @Post('list')
  list(@Body() body: any, @Query() query: any) {
    return this.attendanceService.list(body?.branchId, body?.companyId, query);
  }

  // Top summary cards.
  @Post('stats')
  stats(@Body() body: any, @Query() query: any) {
    return this.attendanceService.stats(body?.branchId, body?.companyId, query);
  }

  // Manual HR Edit / Correction endpoint.
  @Put(':id')
  updatePunch(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.attendanceService.updatePunch(id, body, req?.user);
  }
}
