
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
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
      
        { companyId: new RegExp(search, 'i') },
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
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedPageSize = Math.max(parseInt(page_size, 10) || 10, 1);
  const skip = (parsedPage - 1) * parsedPageSize;
  const limit = parsedPageSize;
  const data = await this.companyModel
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .exec();



  const count = await this.companyModel.countDocuments(filter);

  return {
    data,
    count
  };
}
  

  async getBranchesByCompanyId(  companyId: string,
    query: any
  ): Promise<{ data: Branch[]; count: number }> {
    const {
      page = 1,
      page_size = 10,
      search = '',
      ordering = '',
      name = '',
      manager = '',
      email = '',
      phoneNumber = '',
    } = query;
    // Build the filter object
    const filter: any = { companyId: companyId };
  
    // Search across multiple fields if search term is provided
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { manager: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phoneNumber: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') },
      ];
    }
  
    // Individual field filters
    if (name) filter.name = new RegExp(name, 'i');
    if (manager) filter.manager = new RegExp(manager, 'i');
    if (email) filter.email = new RegExp(email, 'i');
    if (phoneNumber) filter.phoneNumber = new RegExp(phoneNumber, 'i');
  
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
    const data = await this.BranchModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
  
    const count = await this.BranchModel.countDocuments(filter);
  
    return {
      data,
      count
    };
  }
  async getallcompany(companyId: string) {
    return this.companyModel.find({});
  }
  async updateCompany(companyId: string, updateCompanyDto: CreateCompanyDto) {
    return this.companyModel.findByIdAndUpdate(companyId, updateCompanyDto, { new: true });
  }
  async checkandverifyfield(body: any) {
    try {
      if(body.field=="companyId"){
          let check=await this.companyModel.find({companyId:body.companyId});
          if(check.length){
            return {status:false,message:"Company Id already Exist"}
          }
          else{
            return {status:true}
          }
      }
      else if(body.field=="company_email"){
        let check=await this.companyModel.find({email:body.email});
        if(check.length){
            return {status:false,message:"Email already Exist"}
          }
          else{
            return {status:true}
          }

      }

    } catch (error) {
      
    }
  }
  async deleteCompany(companyId: string) {
    await this.companyModel.findByIdAndDelete(companyId);
    return { message: 'Company deleted successfully' };
  }
  async deleteCompanies(ids: string[]) {
    // Convert and validate all IDs
    const objectIds :any = [];
    const invalidIds :any = [];
    
    for (const id of ids) {
      if (Types.ObjectId.isValid(id)) {
        objectIds.push(new Types.ObjectId(id));
      } else {
        invalidIds.push(id);
      }
    }

    if (invalidIds.length) {
      throw new BadRequestException(`Invalid company IDs: ${invalidIds.join(', ')}`);
    }

    const result = await this.companyModel.deleteMany({
      _id: { $in: objectIds }
    });

    if (result.deletedCount === 0) {
      return { message: 'No companies found to delete' };
    }

    return {
      message: `Deleted ${result.deletedCount} companies successfully`,
      deletedCount: result.deletedCount
    };
  }

}
