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
  constructor(
    @InjectModel(Department.name) private departmentModel: Model<Department>,  // Inject the Department model
  ) {}

  // Get all departments by branchId
  async getDepartmentsByBranchId(branchId: string) {
    return this.departmentModel.find({ branchId }).exec();  // Fetch departments for the given branchId
  }

  // Create a new department
  async createDepartment(createDepartmentDto: CreateDepartmentDto) {
    const newDepartment = new this.departmentModel(createDepartmentDto);
    return newDepartment.save();  // Save the new department in the database
  }

  // Update an existing department
  async updateDepartment(departmentId: string, updateDepartmentDto: CreateDepartmentDto) {
    const updatedDepartment = await this.departmentModel.findByIdAndUpdate(departmentId, updateDepartmentDto, { new: true });
    if (!updatedDepartment) {
      return { message: 'Department not found' };
    }
    return updatedDepartment;  // Return the updated department
  }

  // Delete a department by its ID
  async deleteDepartment(departmentId: string) {
    const department = await this.departmentModel.findByIdAndDelete(departmentId);
    if (department) {
      return { message: 'Department deleted successfully' };
    }
    return { message: 'Department not found' };
  }
}
