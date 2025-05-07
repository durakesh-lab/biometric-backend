

import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { Query } from '@nestjs/common';


@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  // @Get()
  // getAllCompanies() {
  //   return this.companyService.getAllCompanies();
  // }

  @Get()
getAllCompanies(
  @Query('search') search?: string,
  @Query('sortBy') sortBy: string = 'name',
  @Query('order') order: 'asc' | 'desc' = 'asc',
) {
  return this.companyService.getAllCompanies(search, sortBy, order);
}

  @Get(':companyId/branches')
  getBranches(@Param('companyId') companyId: string) {
    return this.companyService.getBranchesByCompanyId(companyId);
  }

  

  @Post()
  createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companyService.createCompany(createCompanyDto);
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
}
