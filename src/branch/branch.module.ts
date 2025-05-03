// import { Module } from '@nestjs/common';
// import { BranchController } from './branch.controller';
// import { BranchService } from './branch.service';
// import { DepartmentModule } from '../department/department.module';  // Import DepartmentModule

// @Module({
//   imports: [DepartmentModule],  // Ensure DepartmentModule is in imports array
//   controllers: [BranchController],
//   providers: [BranchService],
// })
// export class BranchModule {}  // Ensure BranchModule is exported here


// src/branch/branch.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BranchController } from './branch.controller';
import { BranchService } from './branch.service';
import { Branch, BranchSchema } from './branch.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Branch.name, schema: BranchSchema }])
  ],
  controllers: [BranchController],
  providers: [BranchService],
  exports:[]
})
export class BranchModule {}
