// import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
// import { DepartmentService } from './department.service';
// import { CreateDepartmentDto } from './dto/create-department.dto';

// @Controller('department')
// export class DepartmentController {
//   constructor(private readonly departmentService: DepartmentService) {}

//   @Get(':branchId')
//   getDepartmentsByBranch(@Param('branchId') branchId: number) {
//     return this.departmentService.getDepartmentsByBranchId(branchId);
//   }

//   @Post()
//   createDepartment(@Body() createDepartmentDto: CreateDepartmentDto) {
//     return this.departmentService.createDepartment(createDepartmentDto);
//   }

//   @Put(':departmentId')
//   updateDepartment(@Param('departmentId') departmentId: number, @Body() updateDepartmentDto: CreateDepartmentDto) {
//     return this.departmentService.updateDepartment(departmentId, updateDepartmentDto);
//   }

//   @Delete(':departmentId')
//   deleteDepartment(@Param('departmentId') departmentId: number) {
//     return this.departmentService.deleteDepartment(departmentId);
//   }
// }


import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('department')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  // Get every department across all branches.
  @Get()
  async getAllDepartments(@Query() query: any) {
    return this.departmentService.getAllDepartments(query);
  }

  // Get all departments for a given branch
  @Get(':branchId')
  async getDepartmentsByBranch(
    @Param('branchId') branchId: string,
    @Query() query: any
  ) {
    return this.departmentService.getDepartmentsByBranchId(branchId, query);
  }

  // Create a new department
  @Post()
  async createDepartment(@Body() body: any) {
    return this.departmentService.createDepartment(body);  // Create new department
  }

  // Update an existing department
  @Put(':departmentId')
  async updateDepartment(
    @Param('departmentId') departmentId: string, 
    @Body() updateDepartmentDto: CreateDepartmentDto
  ) {
    return this.departmentService.updateDepartment(departmentId, updateDepartmentDto);  // Update department
  }
  @Post('delete-bulk')
  deleteDepartments(@Body() body: { Ids: string[] }) {
    return this.departmentService.deletedepartments(body.Ids);
  }
  // Delete a department
  @Delete(':departmentId')
  async deleteDepartment(@Param('departmentId') departmentId: string) {
    return this.departmentService.deleteDepartment(departmentId);  // Delete department by ID
  }
      @Post('checkandverifyfields')
  async checkandverifyfield(@Body() body: any) {
    return this.departmentService.checkandverifyfields(body);
  }
}
