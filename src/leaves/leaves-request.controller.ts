

import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { LeavesRequestService } from './leaves-request.service';
// import { CreateCompanyDto } from './dto/create-company.dto';
import { Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';


@UseGuards(JwtAuthGuard)
@Controller('leaves-request')
export class leavesrequestController {
  constructor(private readonly leacerequestService: LeavesRequestService) {}


  // @Get()
  // async getAllCompanies(@Query() query: any) {
  //   return this.leacerequestService.getAllCompanies(query);
  // }

}
