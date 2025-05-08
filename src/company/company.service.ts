
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
// company.service.ts
async getAllCompanies(query: any): Promise<{ data: Company[]; count: number }> {
  const {
    page = 1,
    page_size = 10,
    search = '',
    ordering = '',
    companyId = '',
    name = '',
    owner = '',
    email = '',
    phoneNumber = '',
    industry = '',
  } = query;

  // Build the filter object
  const filter: any = {};

  // Search across multiple fields if search term is provided
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { owner: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { phoneNumber: new RegExp(search, 'i') },
      { industry: new RegExp(search, 'i') },
    ];
  }

  // Individual field filters
  if (companyId) filter.companyId = new RegExp(companyId, 'i');
  if (name) filter.name = new RegExp(name, 'i');
  if (owner) filter.owner = new RegExp(owner, 'i');
  if (email) filter.email = new RegExp(email, 'i');
  if (phoneNumber) filter.phoneNumber = new RegExp(phoneNumber, 'i');
  if (industry) filter.industry = new RegExp(industry, 'i');

  // Handle sorting
  let sort = {};
  if (ordering) {
    const sortDirection = ordering.startsWith('-') ? -1 : 1;
    const sortField = ordering.startsWith('-') ? ordering.substring(1) : ordering;
    sort = { [sortField]: sortDirection };
  }

  // Calculate pagination
  const skip = (page - 1) * page_size;
  const limit = parseInt(page_size);

  // Execute queries
  const data = await this.companyModel
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('branches')
    .exec();

  const count = await this.companyModel.countDocuments(filter);

  return {
    data,
    count
  };
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
