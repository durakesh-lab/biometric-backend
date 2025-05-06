
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company } from './company.schema';
import { CreateCompanyDto } from './dto/create-company.dto';
import { Branch } from 'src/branch/branch.schema';

@Injectable()
export class CompanyService {
  constructor(@InjectModel(Company.name) private companyModel: Model<Company>,@InjectModel(Branch.name) private BranchModel: Model<Branch>) {}

  async createCompany(createCompanyDto: CreateCompanyDto): Promise<Company> {
    // Create a new company and initialize branches as an empty array
    const createdCompany = new this.companyModel({ ...createCompanyDto, branches: [] });
    return createdCompany.save();
  }

  // async getAllCompanies(): Promise<Company[]> {
  //   return this.companyModel.find().populate('branches').exec();  // Ensure branches are populated
  // }
  async getAllCompanies(
    search?: string,
    sortBy: string = 'name',
    order: 'asc' | 'desc' = 'asc',
  ): Promise<Company[]> {
    const filter: any = {};
  
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { industry: new RegExp(search, 'i') },
      ];
    }
  
    const sortOrder = order === 'asc' ? 1 : -1;
  
    return this.companyModel
      .find(filter)
      .sort({ [sortBy]: sortOrder })
      .populate('branches')
      .exec();
  }
  

  async getBranchesByCompanyId(companyId: string) {

    const company:any = await this.BranchModel.find({companyId});
    return company || [];
  }

  async updateCompany(companyId: string, updateCompanyDto: CreateCompanyDto) {
    return this.companyModel.findByIdAndUpdate(companyId, updateCompanyDto, { new: true });
  }

  async deleteCompany(companyId: string) {
    await this.companyModel.findByIdAndDelete(companyId);
    return { message: 'Company deleted successfully' };
  }
}
