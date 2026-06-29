

import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { LeavesService } from './leaves.service';
// import { CreateCompanyDto } from './dto/create-company.dto';
import { Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';


@UseGuards(JwtAuthGuard)
@Controller('leaves')
export class leavesController {
  constructor(private readonly leavesService: LeavesService) {}


  @Post("myleaves")
  async getmyLeaves(@Body() body: any) {
    return this.leavesService.myLeaves(body);
  }

    @Post("applyleave")
  async applyleave(@Body() body: any) {
    return this.leavesService.applyleave(body);
  }

  
    @Post("getmyleaves")
  async getmyleaves(@Body() body: any,@Query() query:any) {

    return this.leavesService.getMyLeaves(body,query);
  }
      @Post("getAllLeaves")
  async getAllLeaves(@Body() body: any,@Query() query:any) {
    return this.leavesService.getAllLeaves(body,query);
  }

        @Post("updateLeaveStatus")
  async updateLeave(@Body() body: any,@Query() query:any) {
    return this.leavesService.updateLeaveStatus(body.leave_id,body.approved_by,body.decision);
  }

    @Post('add-shift')
  addShift(@Body() dto: any) {
    return this.leavesService.addShift(dto);
  }
    @Post('getMyShift')
  getMyShift(@Body() dto: any) {
    return this.leavesService.getMyShift(dto);
  }
  
}
