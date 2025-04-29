import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';

@Controller('branch')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Get(':branchId/departments')
  getDepartments(@Param('branchId') branchId: number) {
    return this.branchService.getDepartmentsByBranchId(branchId);
  }

  @Post()
  createBranch(@Body() createBranchDto: CreateBranchDto) {
    return this.branchService.createBranch(createBranchDto);
  }

  @Put(':branchId')
  updateBranch(@Param('branchId') branchId: number, @Body() updateBranchDto: CreateBranchDto) {
    return this.branchService.updateBranch(branchId, updateBranchDto);
  }

  @Delete(':branchId')
  deleteBranch(@Param('branchId') branchId: number) {
    return this.branchService.deleteBranch(branchId);
  }
}
