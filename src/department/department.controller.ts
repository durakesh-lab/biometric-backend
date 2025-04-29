import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Controller('department')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Get(':branchId')
  getDepartmentsByBranch(@Param('branchId') branchId: number) {
    return this.departmentService.getDepartmentsByBranchId(branchId);
  }

  @Post()
  createDepartment(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.createDepartment(createDepartmentDto);
  }

  @Put(':departmentId')
  updateDepartment(@Param('departmentId') departmentId: number, @Body() updateDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.updateDepartment(departmentId, updateDepartmentDto);
  }

  @Delete(':departmentId')
  deleteDepartment(@Param('departmentId') departmentId: number) {
    return this.departmentService.deleteDepartment(departmentId);
  }
}
