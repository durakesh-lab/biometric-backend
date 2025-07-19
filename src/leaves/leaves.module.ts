
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LeaveRequest, LeaveRequestSchema } from './leaves_request.schema';
// import { BranchModule } from 'src/branch/branch.module';
import { LeavesSchema,Leaves } from './leaves.schema';
import { leavesController } from './leaves.controller';
import { leavesrequestController } from './leaves_request.controller';
import { LeavesService } from './leaves.service';
import { LeavesRequestService } from './leaves_request.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Leaves.name, schema: LeavesSchema },{name:LeaveRequest.name,schema:LeaveRequestSchema}])],
  controllers: [leavesController,leavesrequestController],
  providers: [LeavesService,LeavesRequestService],
})
export class LeaveModule {}
