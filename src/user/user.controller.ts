// import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
// import { UserService } from './user.service';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// @Controller('users')
// export class UserController {
//   constructor(private readonly userService: UserService) {}

//   @Get(':username')
//   async getUser(@Param('username') username: string) {
//     return this.userService.findOne(username);
//   }
//   @Post('edituser/:id')
//   async editUser(@Body() body: any,@Param() id:any) {
//     return this.userService.editeUser(body);
//   }
//   @Get('deleteUser/:id')
//   async deleteUser(@Body() body: any,@Param() id:any) {
//     return this.userService.deleteUser(id.id);
//   }
//   @Post('allusers')
//   async geAllUsers(@Body() body: any,@Query() query:any) {
//     let {branchId,companyId} =body
//     // let deptId=query.deptId
//     return this.userService.getAllUsers(branchId,companyId,query);
//   }
// }

// user.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Get,
  Param,
  Query
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UserService } from './user.service';
import type { Request } from 'express';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
      }),
    })
  )
  importUsers(@UploadedFile() file: any) {
    return this.userService.importUsers(file.path);
  }

  @Post('edituser/:id')
  editUser(@Body() body: any, @Param('id') id: string) {
    return this.userService.editeUser({ ...body, id });
  }

  @Get('deleteUser/:id')
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  @Post('allusers')
  geAllUsers(@Body() body: any, @Query() query: any) {
    const { branchId, companyId } = body;
    return this.userService.getAllUsers(branchId, companyId, query);
  }

  @Get('getuser/:id')
  getUserById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Get(':username')
  getUser(@Param('username') username: string) {
    return this.userService.findOne(username);
  }
}
