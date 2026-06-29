

import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';


// Authenticated for all; company management is admin-only.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Super Admin', 'HR Admin')
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  // @Get()
  // getAllCompanies() {
  //   return this.companyService.getAllCompanies();
  // }

  @Get()
  async getAllCompanies(@Query() query: any) {
    return this.companyService.getAllCompanies(query);
  }
    @Get("allcompany")
  async getCompanies(@Query() query: any) {
    return this.companyService.getallcompany(query);
  }

  @Get(':companyId/branches')
  getBranches( @Param('companyId') companyId: string,
  @Query() query: any) {
    return this.companyService.getBranchesByCompanyId(companyId,query);
  }

  

  @Post()
  createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companyService.createCompany(createCompanyDto);
  }
  
  @Post("checkandverifyfields")
  checkcompanyfields(@Body() createCompanyDto: any) {
    return this.companyService.checkandverifyfield(createCompanyDto);
  }

  @Put(':companyId')
  updateCompany(
    @Param('companyId') companyId: string,
    @Body() updateCompanyDto: CreateCompanyDto,
  ) {
    return this.companyService.updateCompany(companyId, updateCompanyDto);
  }

  @Delete(':companyId')
  deleteCompany(@Param('companyId') companyId: string) {
    return this.companyService.deleteCompany(companyId);
  }
  @Post('delete-bulk')
deleteCompanies(@Body() body: { companyIds: string[] }) {
  return this.companyService.deleteCompanies(body.companyIds);
}
}
