import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Attendance, AttendanceSchema } from '../attendance/attendance.schema';
import { Company, CompanySchema } from '../company/company.schema';
import { Employee, EmployeeSchema } from '../employee/employee.schema';
import {
  LeaveRequest,
  LeaveRequestSchema,
} from '../leaves/leaves-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: Company.name, schema: CompanySchema },
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
