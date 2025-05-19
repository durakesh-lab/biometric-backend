import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CompanyModule } from './company/company.module';
import { MicroserviceModule } from './microservice/microservice.module';
import { BranchModule } from './branch/branch.module';
import { DepartmentModule } from './department/department.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017'),
    AuthModule,
    UserModule,
    CompanyModule, 
    MicroserviceModule,
    BranchModule,
    DepartmentModule,
  ],
})
export class AppModule {}
