import { Controller, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuditLogService } from './auditlog.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('auditlog')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Post('list')
  list(@Body() body: any, @Query() query: any) {
    const combinedQuery = { ...query, ...body };
    return this.auditLogService.list(combinedQuery);
  }

  @Post('stats')
  stats(@Body() body: any, @Query() query: any) {
    const combinedQuery = { ...query, ...body };
    return this.auditLogService.stats(combinedQuery);
  }
}
