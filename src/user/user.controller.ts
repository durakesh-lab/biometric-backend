

// import { Controller, Get, Param } from '@nestjs/common';
// import { UserService } from './user.service';

// @Controller('users')
// export class UserController {
//   constructor(private readonly userService: UserService) {}

//   @Get(':username')
//   async getUser(@Param('username') username: string) {
//     return this.userService.findOne(username);
//   }
// }

// user.controller.ts

import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':username')
  async getUser(@Param('username') username: string) {
    return this.userService.findOne(username);
  }
  @Post('edituser/:id')
  async editUser(@Body() body: any,@Param() id:any) {
    return this.userService.editeUser(body);
  }
    @Post('checkandverifyfields')
  async checkandverifyfield(@Body() body: any) {
    return this.userService.checkandverifyfields(body);
  }
  
  @Get('deleteUser/:id')
  async deleteUser(@Body() body: any,@Param() id:any) {
    return this.userService.deleteUser(id.id);
  }
    @Post('delete-bulk')
deleteBranches(@Body() body: { Ids: string[] }) {
  return this.userService.deleteUsers(body.Ids);
}
  @Post('allusers')
  async geAllUsers(@Body() body: any,@Query() query:any) {
    let {branchId,companyId} =body
    // let deptId=query.deptId
    return this.userService.getAllUsers(branchId,companyId,query);
  }
}
