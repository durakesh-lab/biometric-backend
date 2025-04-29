import { Injectable } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentService {
  private departments = [
    { id: 1, name: 'Department 1', branchId: 1 },
    { id: 2, name: 'Department 2', branchId: 1 },
    { id: 3, name: 'Department 3', branchId: 2 },
  ];

  getDepartmentsByBranchId(branchId: number) {
    return this.departments.filter(department => department.branchId === branchId);
  }

  createDepartment(createDepartmentDto: CreateDepartmentDto) {
    const newDepartment = { id: Date.now(), ...createDepartmentDto };
    this.departments.push(newDepartment);
    return newDepartment;
  }

  updateDepartment(departmentId: number, updateDepartmentDto: CreateDepartmentDto) {
    const department = this.departments.find(d => d.id === departmentId);
    if (department) {
      Object.assign(department, updateDepartmentDto);
      return department;
    }
    return null;
  }

  deleteDepartment(departmentId: number) {
    const index = this.departments.findIndex(d => d.id === departmentId);
    if (index > -1) {
      this.departments.splice(index, 1);
      return { message: 'Department deleted successfully' };
    }
    return { message: 'Department not found' };
  }
}
