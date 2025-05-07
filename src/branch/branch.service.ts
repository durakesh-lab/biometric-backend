// import { Injectable } from '@nestjs/common';
// import { CreateBranchDto } from './dto/create-branch.dto';

// @Injectable()
// export class BranchService {
//   private branches = [
//     {
//       id: 1,
//       name: 'Branch 1',
//       departments: [
//         { id: 1, name: 'Department 1' },
//         { id: 2, name: 'Department 2' },
//       ],
//     },
//     {
//       id: 2,
//       name: 'Branch 2',
//       departments: [
//         { id: 3, name: 'Department 3' },
//       ],
//     },
//   ];

//   getDepartmentsByBranchId(branchId: number) {
//     const branch = this.branches.find(branch => branch.id === branchId);
//     return branch?.departments || [];
//   }

//   createBranch(createBranchDto: CreateBranchDto) {
//     const newBranch = { id: Date.now(), ...createBranchDto, departments: [] };
//     this.branches.push(newBranch);
//     return newBranch;
//   }

//   updateBranch(branchId: number, updateBranchDto: CreateBranchDto) {
//     const branch = this.branches.find(b => b.id === branchId);
//     if (branch) {
//       Object.assign(branch, updateBranchDto);
//       return branch;
//     }
//     return null;
//   }

//   deleteBranch(branchId: number) {
//     const index = this.branches.findIndex(b => b.id === branchId);
//     if (index > -1) {
//       this.branches.splice(index, 1);
//       return { message: 'Branch deleted successfully' };
//     }
//     return { message: 'Branch not found' };
//   }
// }

// import { Injectable } from '@nestjs/common';
// import { CreateBranchDto } from './dto/create-branch.dto';

// @Injectable()
// export class BranchService {
//   private branches = [
//     {
//       id: 1,
//       name: 'Branch 1',
//       manager: 'John Manager',
//       address: '456 Street, City',
//       phoneNumber: '+123456789',
//       email: 'branch1@example.com',
//       companyId: 1,
//       departments: [
//         { id: 1, name: 'Department 1' },
//         { id: 2, name: 'Department 2' },
//       ],
//     },
//     {
//       id: 2,
//       name: 'Branch 2',
//       manager: 'Jane Manager',
//       address: '789 Avenue, City',
//       phoneNumber: '+987654321',
//       email: 'branch2@example.com',
//       companyId: 1,
//       departments: [
//         { id: 3, name: 'Department 3' },
//       ],
//     },
//   ];

//   getDepartmentsByBranchId(branchId: number) {
//     const branch = this.branches.find(branch => branch.id === branchId);
//     return branch?.departments || [];
//   }

//   createBranch(createBranchDto: CreateBranchDto) {
//     const newBranch = { 
//       id: Date.now(), 
//       ...createBranchDto, 
//       departments: [] 
//     };
//     this.branches.push(newBranch);
//     return newBranch;
//   }

//   updateBranch(branchId: number, updateBranchDto: CreateBranchDto) {
//     const branch = this.branches.find(b => b.id === branchId);
//     if (branch) {
//       Object.assign(branch, updateBranchDto);
//       return branch;
//     }
//     return null;
//   }

//   deleteBranch(branchId: number) {
//     const index = this.branches.findIndex(b => b.id === branchId);
//     if (index > -1) {
//       this.branches.splice(index, 1);
//       return { message: 'Branch deleted successfully' };
//     }
//     return { message: 'Branch not found' };
//   }
// }


// // src/branch/branch.service.ts

// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Branch } from './branch.schema';
// import { CreateBranchDto } from './dto/create-branch.dto';

// @Injectable()
// export class BranchService {
//   constructor(@InjectModel(Branch.name) private branchModel: Model<Branch>) {}

//   async createBranch(createBranchDto: CreateBranchDto): Promise<Branch> {
//     const branch = new this.branchModel({ ...createBranchDto, departments: [] });
//     return branch.save();
//   }

//   async getBranchById(branchId: string): Promise<Branch | null> {
//     return this.branchModel.findById(branchId);
//   }
  

//   async getDepartmentsByBranchId(branchId: string) {
//     const branch = await this.branchModel.findById(branchId);
//     return branch?.departments || [];
//   }

//   async updateBranch(branchId: string, updateBranchDto: CreateBranchDto) {
//     return this.branchModel.findByIdAndUpdate(branchId, updateBranchDto, { new: true });
//   }

//   async deleteBranch(branchId: string) {
//     const result = await this.branchModel.findByIdAndDelete(branchId);
//     if (result) return { message: 'Branch deleted successfully' };
//     return { message: 'Branch not found' };
//   }
// }

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Branch } from './branch.schema';
import { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class BranchService {
  constructor(@InjectModel(Branch.name) private branchModel: Model<Branch>) {}

  async createBranch(createBranchDto: CreateBranchDto): Promise<Branch> {
    const branch = new this.branchModel({ ...createBranchDto, departments: [] });
    return branch.save();
  }

  async getBranchById(branchId: string): Promise<Branch | null> {
    return this.branchModel.findById(branchId);
  }

  async getDepartmentsByBranchId(branchId: string) {
    const branch = await this.branchModel.findById(branchId);
    return branch?.departments || [];
  }

  async updateBranch(branchId: string, updateBranchDto: CreateBranchDto) {
    return this.branchModel.findByIdAndUpdate(branchId, updateBranchDto, { new: true });
  }

  async deleteBranch(branchId: string) {
    const result = await this.branchModel.findByIdAndDelete(branchId);
    if (result) return { message: 'Branch deleted successfully' };
    return { message: 'Branch not found' };
  }

  // Sorting and searching branches
  async getBranches(query: any): Promise<Branch[]> {
    const { name, sortBy, sortOrder, page = 1, limit = 10 } = query;

    // Build search filter
    const searchFilter: any = {};
    if (name) {
      searchFilter.name = { $regex: name, $options: 'i' }; // Case-insensitive search
    }

    // Build sorting options
    const sortOptions: any = {};
    if (sortBy && sortOrder) {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions.name = 1; // Default sort by name ascending
    }

    // Pagination
    const skip = (page - 1) * limit;

    return this.branchModel
      .find(searchFilter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);
  }
}
