import { Injectable } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { Department } from './department.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class DepartmentService {
  constructor(@InjectModel(Department.name) private deptModel: Model<Department>) {}
  private departments = [
    { id: 1, name: 'Department 1', branchId: 1 },
    { id: 2, name: 'Department 2', branchId: 1 },
    { id: 3, name: 'Department 3', branchId: 2 },
  ];

  getDepartmentsByBranchId(branchId: number) {
    // return this.departments.filter(department => department.branchId === branchId);
    return this.deptModel.find({branchId})
  }

  createDepartment(createDepartmentDto: CreateDepartmentDto) {
         let dept_data=new this.deptModel({...createDepartmentDto})
         return dept_data.save()
    // const newDepartment = { id: Date.now(), ...createDepartmentDto };
    // this.departments.push(newDepartment);
    // return newDepartment;
  }

  async updateDepartment(departmentId: number, updateDepartmentDto: CreateDepartmentDto) {
    // const department = this.departments.find(d => d.id === departmentId);
    // if (department) {
    //   Object.assign(department, updateDepartmentDto);
    //   return department;
    // }
    // return null;

           return this.deptModel.findByIdAndUpdate(departmentId, updateDepartmentDto, { new: true });
  }

  async deleteDepartment(departmentId: number) {
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
