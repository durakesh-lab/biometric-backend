

import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { LeavesRequestService } from './leaves_request.service';
// import { CreateCompanyDto } from './dto/create-company.dto';
import { Query } from '@nestjs/common';


@Controller('leaves')
export class leavesrequestController {
  constructor(private readonly leacerequestService: LeavesRequestService) {}


//   @Get()
//   async getAllCompanies(@Query() query: any) {
//     return this.leacerequestService.getAllCompanies(query);
//   }

}
