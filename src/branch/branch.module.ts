import { Module } from '@nestjs/common';
import { BranchController } from './branch.controller';
import { BranchService } from './branch.service';
import { DepartmentModule } from '../department/department.module';  // Import DepartmentModule

@Module({
  imports: [DepartmentModule],  // Ensure DepartmentModule is in imports array
  controllers: [BranchController],
  providers: [BranchService],
})
export class BranchModule {}  // Ensure BranchModule is exported here
