// import { Injectable } from '@nestjs/common';
// import { CreateDepartmentDto } from './dto/create-department.dto';

// @Injectable()
// export class DepartmentService {
//   private departments = [
//     { id: 1, name: 'Department 1', branchId: 1 },
//     { id: 2, name: 'Department 2', branchId: 1 },
//     { id: 3, name: 'Department 3', branchId: 2 },
//   ];

//   getDepartmentsByBranchId(branchId: number) {
//     return this.departments.filter(department => department.branchId === branchId);
//   }

//   createDepartment(createDepartmentDto: CreateDepartmentDto) {
//     const newDepartment = { id: Date.now(), ...createDepartmentDto };
//     this.departments.push(newDepartment);
//     return newDepartment;
//   }

//   updateDepartment(departmentId: number, updateDepartmentDto: CreateDepartmentDto) {
//     const department = this.departments.find(d => d.id === departmentId);
//     if (department) {
//       Object.assign(department, updateDepartmentDto);
//       return department;
//     }
//     return null;
//   }

//   deleteDepartment(departmentId: number) {
//     const index = this.departments.findIndex(d => d.id === departmentId);
//     if (index > -1) {
//       this.departments.splice(index, 1);
//       return { message: 'Department deleted successfully' };
//     }
//     return { message: 'Department not found' };
//   }
// }


import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department } from './department.schema';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentService {
  constructor(@InjectModel(Department.name) private deptModel: Model<Department>) {}
  private departments = [
    { id: 1, name: 'Department 1', branchId: 1 },
    { id: 2, name: 'Department 2', branchId: 1 },
    { id: 3, name: 'Department 3', branchId: 2 },
  ];

// department.service.ts
async getDepartmentsByBranchId(
  branchId: string,
  query: any
): Promise<{ data: Department[]; count: number }> {
  const {
    page = 1,
    page_size = 10,
    search = '',
    ordering = '',
    name = '',
    dept_code = '',
  } = query;

  // Build the filter object
  const filter: any = { branchId };

  // Search across multiple fields if search term is provided
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { dept_code: new RegExp(search, 'i') },
      { otherDetails: new RegExp(search, 'i') },
    ];
  }

  // Individual field filters
  if (name) filter.name = new RegExp(name, 'i');
  if (dept_code) filter.dept_code = new RegExp(dept_code, 'i');

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
  const data = await this.deptModel
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .exec();

  const count = await this.deptModel.countDocuments(filter);

  return {
    data,
    count
  };
}

  createDepartment(createDepartmentDto: CreateDepartmentDto) {
         let dept_data=new this.deptModel({...createDepartmentDto})
         return dept_data.save()
    // const newDepartment = { id: Date.now(), ...createDepartmentDto };
    // this.departments.push(newDepartment);
    // return newDepartment;
  }

  async updateDepartment(departmentId: string, updateDepartmentDto: CreateDepartmentDto) {
    // const department = this.departments.find(d => d.id === departmentId);
    // if (department) {
    //   Object.assign(department, updateDepartmentDto);
    //   return department;
    // }
    // return null;

           return this.deptModel.findByIdAndUpdate(departmentId, updateDepartmentDto, { new: true });
  }

  async deleteDepartment(departmentId: string) {
    // const index = this.departments.findIndex(d => d.id === departmentId);
    // if (index > -1) {
    //   this.departments.splice(index, 1);
    //   return { message: 'Department deleted successfully' };
    // }
    // return { message: 'Department not found' };


    const result = await this.deptModel.findByIdAndDelete(departmentId);
    if (result) return { message: 'Dept deleted successfully' };
    return { message: 'Dept not found' };
  }
}
