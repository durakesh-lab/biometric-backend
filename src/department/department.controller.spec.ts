import { Controller, Get, Param } from '@nestjs/common';
import { DepartmentService } from './department.service';

@Controller('department')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Get(':branchId')
  getDepartmentsByBranch(@Param('branchId') branchId: number) {
    return this.departmentService.getDepartmentsByBranchId(branchId);
  }
}
