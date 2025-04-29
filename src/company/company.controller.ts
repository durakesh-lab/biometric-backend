import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto'

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  getAllCompanies() {
    return this.companyService.getAllCompanies();
  }

  @Get(':companyId/branches')
  getBranches(@Param('companyId') companyId: number) {
    return this.companyService.getBranchesByCompanyId(companyId);
  }

  // @Post()
  // createCompany(@Body() createCompanyDto: CreateCompanyDto) {
  //   return this.companyService.createCompany(createCompanyDto);
  // }

  @Post()
createCompany(@Body() createCompanyDto: CreateCompanyDto) {
  return this.companyService.createCompany(createCompanyDto);
}

  @Put(':companyId')
  updateCompany(@Param('companyId') companyId: number, @Body() updateCompanyDto: CreateCompanyDto) {
    return this.companyService.updateCompany(companyId, updateCompanyDto);
  }

  @Delete(':companyId')
  deleteCompany(@Param('companyId') companyId: number) {
    return this.companyService.deleteCompany(companyId);
  }
}
