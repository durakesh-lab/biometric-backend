

import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { LeavesService } from './leaves.service';
// import { CreateCompanyDto } from './dto/create-company.dto';
import { Query } from '@nestjs/common';


@Controller('leaves')
export class leavesController {
  constructor(private readonly leavesService: LeavesService) {}


  @Post("myleaves")
  async getmyLeaves(@Body() body: any) {
    console.log("wwwwwwwwwwww")
    return this.leavesService.myLeaves(body);
  }

}
