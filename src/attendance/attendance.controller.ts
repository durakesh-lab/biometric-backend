import { Controller, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // Pull punches from EasyWDMS (all devices, or one via body.deviceId).
  @Post('sync')
  sync(@Body() body: any) {
    return this.attendanceService.sync(body?.deviceId);
  }

  // Paginated punch log — body may scope by branchId; query has from/to/employeeId/search.
  @Post('list')
  list(@Body() body: any, @Query() query: any) {
    return this.attendanceService.list(body?.branchId, query);
  }

  // Top summary cards.
  @Post('stats')
  stats(@Body() body: any, @Query() query: any) {
    return this.attendanceService.stats(body?.branchId, query);
  }

  // Demo: inject a punch for an enrolled employee (no hardware needed).
  @Post('test-punch')
  testPunch(@Body() body: any) {
    return this.attendanceService.addTestPunch(body);
  }
}
