import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CompanyModule } from './company/company.module';
import { MicroserviceModule } from './microservice/microservice.module';
import { BranchModule } from './branch/branch.module';
import { DepartmentModule } from './department/department.module';
import { GroupModule } from './groups/group.module';
import { PermissionsModule } from './permission/permission.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017'),
    // MongooseModule.forRoot('mongodb+srv://paromita:GVoSVcDR2FiRliVO@cluster0.rrnavjn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'),
    AuthModule,
    UserModule,
    CompanyModule, 
    MicroserviceModule,
    BranchModule,
    DepartmentModule,
    GroupModule,
    PermissionsModule
  ],
})
export class AppModule {}
