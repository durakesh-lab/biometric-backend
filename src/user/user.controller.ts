// import { Controller, Post, Body } from '@nestjs/common';
// import { UserService } from './user.service';

// @Controller('users')
// export class UserController {
//   constructor(private userService: UserService) {}

//   @Post()
//   async create(@Body() userDto: any) {
//     return this.userService.createUser(userDto);
//   }

//   // Additional routes for managing users
// }

// user.controller.ts

import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':username')
  async getUser(@Param('username') username: string) {
    return this.userService.findOne(username);
  }
}
