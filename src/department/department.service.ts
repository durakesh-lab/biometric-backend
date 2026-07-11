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


import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

  private async listDepartments(branchId: string, query: any): Promise<{
    data: Department[];
    count: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const {
      page,
      page_size,
      search = '',
      ordering = '',
      name = '',
      dept_code = '',
    } = query || {};

    const filter: any = {};
    if (branchId) filter.branchId = branchId;

    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { dept_code: new RegExp(search, 'i') },
        { otherDetails: new RegExp(search, 'i') },
      ];
    }

    if (name) filter.name = new RegExp(name, 'i');
    if (dept_code) filter.dept_code = new RegExp(dept_code, 'i');

    const sort: any = {};
    if (ordering) {
      const sortDirection = ordering.startsWith('-') ? -1 : 1;
      const sortField = ordering.startsWith('-') ? ordering.substring(1) : ordering;
      sort[sortField] = sortDirection;
    }

    const shouldPaginate = page_size !== undefined && page_size !== null && page_size !== '';
    const currentPage = shouldPaginate ? Math.max(parseInt(page, 10) || 1, 1) : 1;
    const limit = shouldPaginate ? Math.max(parseInt(page_size, 10) || 0, 0) : 0;
    const skip = shouldPaginate ? (currentPage - 1) * limit : 0;

    let listQuery = this.deptModel.find(filter);
    if (Object.keys(sort).length > 0) {
      listQuery = listQuery.sort(sort);
    }
    if (shouldPaginate && limit > 0) {
      listQuery = listQuery.skip(skip).limit(limit);
    }

    const [data, count] = await Promise.all([
      listQuery.exec(),
      this.deptModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      count,
      page: currentPage,
      page_size: shouldPaginate ? limit : count,
      total_pages: shouldPaginate && limit > 0 ? Math.ceil(count / limit) : 1,
    };
  }

  async getDepartmentsByBranchId(
    branchId: string,
    query: any,
  ): Promise<{ data: Department[]; count: number }> {
    return this.listDepartments(branchId, query);
  }

  async getAllDepartments(query: any): Promise<{ data: Department[]; count: number }> {
    return this.listDepartments('', query);
  }

  createDepartment(createDepartmentDto: any) {
         const payload = {
           name: createDepartmentDto?.name ?? createDepartmentDto?.departmentName ?? '',
           dept_code: createDepartmentDto?.dept_code ?? createDepartmentDto?.deptCode ?? '',
           branchId: createDepartmentDto?.branchId ?? createDepartmentDto?.branch_id ?? createDepartmentDto?.branch ?? '',
           company_id: createDepartmentDto?.company_id ?? createDepartmentDto?.companyId ?? '',
           otherDetails: createDepartmentDto?.otherDetails ?? '',
         };

         let dept_data = new this.deptModel(payload);
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
    async deletedepartments(ids: string[]) {
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
        throw new BadRequestException(`Invalid branch IDs: ${invalidIds.join(', ')}`);
      }
  
      const result = await this.deptModel.deleteMany({
        _id: { $in: objectIds }
      });
  
      if (result.deletedCount === 0) {
        return { message: 'No branches found to delete' };
      }
  
      return {
        message: `Deleted ${result.deletedCount} branches successfully`,
        deletedCount: result.deletedCount
      };
    }


          async checkandverifyfields(body: any) {

    try {
      if(body.field=="dept_code"){
          let check=await this.deptModel.find({dept_code:body.dept_code});
          if(check.length){
            return {status:false,message:"dept code already Exist"}
          }
          else{
            return {status:true}
          }
      }
     

    } catch (error) {
      
    }
  }
}
