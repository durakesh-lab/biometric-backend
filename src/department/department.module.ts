// import { Module } from '@nestjs/common';
// import { DepartmentController } from './department.controller';
// import { DepartmentService } from './department.service';

// @Module({
//   controllers: [DepartmentController],
//   providers: [DepartmentService],
//   exports: [DepartmentService],  // Ensure DepartmentService is exported
// })
// export class DepartmentModule {}


import { Module } from '@nestjs/common';
import { DepartmentController } from './department.controller';
import { DepartmentService } from './department.service';
import { Department, DepartmentSchema } from './department.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports:[MongooseModule.forFeature([{ name: Department.name, schema: DepartmentSchema }])],
  controllers: [DepartmentController],
  providers: [DepartmentService],
  exports: [DepartmentService],  // Export service so other modules can use it
})
export class DepartmentModule {}
