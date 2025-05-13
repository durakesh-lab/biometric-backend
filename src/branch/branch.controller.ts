// import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
// import { BranchService } from './branch.service';
// import { CreateBranchDto } from './dto/create-branch.dto';

// @Controller('branch')
// export class BranchController {
//   constructor(private readonly branchService: BranchService) {}

//   @Get(':branchId/departments')
//   getDepartments(@Param('branchId') branchId: number) {
//     return this.branchService.getDepartmentsByBranchId(branchId);
//   }

//   @Post()
//   createBranch(@Body() createBranchDto: CreateBranchDto) {
//     return this.branchService.createBranch(createBranchDto);
//   }

//   @Put(':branchId')
//   updateBranch(@Param('branchId') branchId: number, @Body() updateBranchDto: CreateBranchDto) {
//     return this.branchService.updateBranch(branchId, updateBranchDto);
//   }

//   @Delete(':branchId')
//   deleteBranch(@Param('branchId') branchId: number) {
//     return this.branchService.deleteBranch(branchId);
//   }
// }


// import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
// import { BranchService } from './branch.service';
// import { CreateBranchDto } from './dto/create-branch.dto';

// @Controller('branch')
// export class BranchController {
//   constructor(private readonly branchService: BranchService) {}

//   @Get(':branchId/departments')
//   getDepartments(@Param('branchId') branchId: number) {
//     return this.branchService.getDepartmentsByBranchId(branchId);
//   }

//   @Post()
//   createBranch(@Body() createBranchDto: CreateBranchDto) {
//     return this.branchService.createBranch(createBranchDto);
//   }

//   @Put(':branchId')
//   updateBranch(@Param('branchId') branchId: number, @Body() updateBranchDto: CreateBranchDto) {
//     return this.branchService.updateBranch(branchId, updateBranchDto);
//   }

//   @Delete(':branchId')
//   deleteBranch(@Param('branchId') branchId: number) {
//     return this.branchService.deleteBranch(branchId);
//   }
// }


// import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
// import { BranchService } from './branch.service';
// import { CreateBranchDto } from './dto/create-branch.dto';

// @Controller('branch')
// export class BranchController {
//   constructor(private readonly branchService: BranchService) {}

//   @Get(':branchId/departments')
//   getDepartments(@Param('branchId') branchId: string) {
//     return this.branchService.getDepartmentsByBranchId(branchId);
//   }

//   @Post()
//   createBranch(@Body() createBranchDto: CreateBranchDto) {
//     return this.branchService.createBranch(createBranchDto);
//   }

//   @Put(':branchId')
//   updateBranch(
//     @Param('branchId') branchId: string,
//     @Body() updateBranchDto: CreateBranchDto
//   ) {
//     return this.branchService.updateBranch(branchId, updateBranchDto);
//   }

//   @Delete(':branchId')
//   deleteBranch(@Param('branchId') branchId: string) {
//     return this.branchService.deleteBranch(branchId);
//   }
// }


// import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
// import { BranchService } from './branch.service';
// import { CreateBranchDto } from './dto/create-branch.dto';

// @Controller('branch')
// export class BranchController {
//   constructor(private readonly branchService: BranchService) {}


//   @Get(':branchId')
// getBranchById(@Param('branchId') branchId: string) {
//   return this.branchService.getBranchById(branchId);
// }


//   @Get(':branchId/departments')
//   getDepartments(@Param('branchId') branchId: string) {
//     return this.branchService.getDepartmentsByBranchId(branchId);
//   }

//   @Post()
//   createBranch(@Body() createBranchDto: CreateBranchDto) {
//     return this.branchService.createBranch(createBranchDto);
//   }

//   @Put(':branchId')
//   updateBranch(
//     @Param('branchId') branchId: string,
//     @Body() updateBranchDto: CreateBranchDto
//   ) {
//     return this.branchService.updateBranch(branchId, updateBranchDto);
//   }

//   @Delete(':branchId')
//   deleteBranch(@Param('branchId') branchId: string) {
//     return this.branchService.deleteBranch(branchId);
//   }
// }

import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';

@Controller('branch')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Get(':branchId')
  getBranchById(@Param('branchId') branchId: string) {
    return this.branchService.getBranchById(branchId);
  }

  @Get(':branchId/departments')
  getDepartments(@Param('branchId') branchId: string) {
    return this.branchService.getDepartmentsByBranchId(branchId);
  }

  @Post()
  createBranch(@Body() createBranchDto: CreateBranchDto) {
    return this.branchService.createBranch(createBranchDto);
  }

  @Put(':branchId')
  updateBranch(
    @Param('branchId') branchId: string,
    @Body() updateBranchDto: CreateBranchDto
  ) {
    return this.branchService.updateBranch(branchId, updateBranchDto);
  }

  @Delete(':branchId')
  deleteBranch(@Param('branchId') branchId: string) {
    return this.branchService.deleteBranch(branchId);
  }

  @Post('delete-bulk')
deleteBranches(@Body() body: { Ids: string[] }) {
  return this.branchService.deleteBranches(body.Ids);
}
  // New route for searching and sorting branches
  @Get()
  getBranches(@Query() query: any) {
    return this.branchService.getBranches(query);
  }
  
}
