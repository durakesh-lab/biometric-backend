import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from './groups.schema';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { Shift, ShiftSchema } from './shift.schema';
import { ShiftService } from './shift.service';
import { ShiftController } from './shift.controller';
import { Employee, EmployeeSchema } from '../employee/employee.schema';
import { Branch, BranchSchema } from '../branch/branch.schema';
import { Department, DepartmentSchema } from '../department/department.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Group.name, schema: GroupSchema },
      { name: Shift.name, schema: ShiftSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: Department.name, schema: DepartmentSchema },
    ]),
  ],
  controllers: [GroupController, ShiftController],
  providers: [GroupService, ShiftService],
  exports: [GroupService, ShiftService],
})
export class GroupModule {}

