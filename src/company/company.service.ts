import { Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompanyService {
  private companies = [
    {
      id: 1,
      name: 'Company 1',
      branches: [
        { id: 1, name: 'Branch 1' },
        { id: 2, name: 'Branch 2' },
      ],
    },
    {
      id: 2,
      name: 'Company 2',
      branches: [
        { id: 3, name: 'Branch 3' },
      ],
    },
  ];

  getAllCompanies() {
    return this.companies;
  }

  getBranchesByCompanyId(companyId: number) {
    const company = this.companies.find(company => company.id === companyId);
    return company?.branches || [];
  }

  // createCompany(createCompanyDto: CreateCompanyDto) {
  //   const newCompany = { id: Date.now(), ...createCompanyDto, branches: [] };
  //   this.companies.push(newCompany);
  //   return newCompany;
  // }
  createCompany(createCompanyDto: CreateCompanyDto) {
    const newCompany = { 
      id: Date.now(), 
      ...createCompanyDto, 
      branches: [] 
    };
    this.companies.push(newCompany);
    return newCompany;
  }  

  updateCompany(companyId: number, updateCompanyDto: CreateCompanyDto) {
    const company = this.companies.find(c => c.id === companyId);
    if (company) {
      Object.assign(company, updateCompanyDto);
      return company;
    }
    return null;
  }

  deleteCompany(companyId: number) {
    const index = this.companies.findIndex(c => c.id === companyId);
    if (index > -1) {
      this.companies.splice(index, 1);
      return { message: 'Company deleted successfully' };
    }
    return { message: 'Company not found' };
  }
}
