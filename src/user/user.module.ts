import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Correct import
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserSchema } from './user.schema'; // Correct schema import
import { Company, CompanySchema } from 'src/company/company.schema';
import { Branch, BranchSchema } from 'src/branch/branch.schema';
import { BranchModule } from 'src/branch/branch.module';
import { CompanyModule } from 'src/company/company.module';
import { Department, DepartmentSchema } from 'src/department/department.schema';
import { DepartmentModule } from 'src/department/department.module';
import { Group, GroupSchema } from 'src/groups/groups.schema';
import { GroupModule } from 'src/groups/group.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema },{ name: Company.name, schema: CompanySchema },{name:Branch.name,schema:BranchSchema},{ name: Department.name, schema: DepartmentSchema } ,{ name: Group.name, schema: GroupSchema } ]), BranchModule,CompanyModule,DepartmentModule,GroupModule // Use 'User' as the model name (value) here
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService], // Export the UserService for use in other modules
})
export class UserModule {}
