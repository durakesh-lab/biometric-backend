import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { EmployeeModule } from './employee/employee.module';
import { DeviceModule } from './device/device.module';
import { AttendanceModule } from './attendance/attendance.module';
import { CompanyModule } from './company/company.module';
import { MicroserviceModule } from './microservice/microservice.module';
import { BranchModule } from './branch/branch.module';
import { DepartmentModule } from './department/department.module';
import { GroupModule } from './groups/group.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PermissionsModule } from './permission/permission.module';
import { SettingModule } from './settings/setting.module';
import { ConfigModule } from '@nestjs/config';
import { LeaveModule } from './leaves/leaves.module';
import { AuditLogModule } from './auditlog/auditlog.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
      ConfigModule.forRoot({
      isGlobal: true, // makes config available everywhere
    }),
    // Global rate limit: 100 requests / minute / IP (blunts DoS + brute-force).
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    // MongooseModule.forRoot('mongodb://localhost:27017'),
    MongooseModule.forRoot(process.env.mongodb_cluster_url!),
    AuthModule,
    UserModule,
    EmployeeModule,
    DeviceModule,
    AttendanceModule,
    CompanyModule,
    MicroserviceModule,
    BranchModule,
    DepartmentModule,
    GroupModule,
    DashboardModule,
    PermissionsModule,
    SettingModule,
    LeaveModule,
    AuditLogModule,
  ],
  providers: [
    // Apply the rate limiter globally.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
