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
import { SettingModule } from './other api/setting.module';
import { ConfigModule } from '@nestjs/config';
import { LeaveModule } from './leaves/leaves.module';

@Module({
  imports: [
      ConfigModule.forRoot({
      isGlobal: true, // makes config available everywhere
    }),
    // MongooseModule.forRoot('mongodb://localhost:27017'),
    MongooseModule.forRoot(process.env.mongodb_cluster_url!),
    AuthModule,
    UserModule,
    CompanyModule, 
    MicroserviceModule,
    BranchModule,
    DepartmentModule,
    GroupModule,
    PermissionsModule,
    SettingModule,
    LeaveModule
  ],
})
export class AppModule {}
