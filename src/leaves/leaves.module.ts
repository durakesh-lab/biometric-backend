
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LeaveRequest, LeaveRequestSchema } from './leaves-request.schema';
// import { BranchModule } from 'src/branch/branch.module';
import { LeavesSchema,Leaves } from './leaves.schema';
import { leavesController } from './leaves.controller';
import { leavesrequestController } from './leaves-request.controller';
import { LeavesService } from './leaves.service';
import { LeavesRequestService } from './leaves-request.service';
import { UserSchema } from 'src/user/user.schema';
import { Company, CompanySchema } from 'src/company/company.schema';
import { Branch, BranchSchema } from 'src/branch/branch.schema';
import { BranchModule } from 'src/branch/branch.module';
import { CompanyModule } from 'src/company/company.module';
import { Group, GroupSchema } from 'src/shiftsandgroups/groups.schema';
import { HolidayController } from './holiday.controller';
import { HolidayService } from './holiday.service';
import { Holiday, HolidaySchema } from './holiday.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema },{ name: Group.name, schema: GroupSchema },{ name: Leaves.name, schema: LeavesSchema },{name:LeaveRequest.name,schema:LeaveRequestSchema},{ name: Company.name, schema: CompanySchema },{name:Branch.name,schema:BranchSchema},{ name: Holiday.name, schema: HolidaySchema }]),BranchModule,CompanyModule],
  controllers: [leavesController,leavesrequestController,HolidayController],
  providers: [LeavesService,LeavesRequestService,HolidayService],
})
export class LeaveModule {}
