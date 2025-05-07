
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { Company, CompanySchema } from './company.schema';
import { BranchModule } from 'src/branch/branch.module';
import { Branch, BranchSchema } from 'src/branch/branch.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema },{name:Branch.name,schema:BranchSchema}]),BranchModule],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
