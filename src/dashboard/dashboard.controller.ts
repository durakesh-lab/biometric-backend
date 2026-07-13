import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

type DashboardQuery = {
  companyId?: string;
  branchId?: string;
};

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  getOverview(@Query() query: DashboardQuery) {
    return this.dashboardService.getOverview(query);
  }
}
