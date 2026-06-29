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
  Query,
  Delete,
  UseGuards,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UserService } from './user.service';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        // Sanitize the original name (strip path/odd chars) before using it.
        filename: (req, file, cb) => {
          const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
          cb(null, `${Date.now()}-${safe}`);
        },
      }),
      // Only accept spreadsheet/CSV mimetypes (or .xlsx/.csv extension).
      fileFilter: (req, file, cb) => {
        const ok = /\.(xlsx|xls|csv)$/i.test(file.originalname) ||
          [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
          ].includes(file.mimetype);
        cb(ok ? null : new BadRequestException('Only .xlsx/.xls/.csv files are allowed'), ok);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB cap (DoS guard)
    })
  )
  importUsers(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.userService.importUsers(file.path);
  }

  @Post('edituser/:id')
  editUser(@Body() body: any, @Param('id') id: string) {
    return this.userService.editUser({ ...body, id });
  }
    @Post('edituser_assigngroup/:id')
  assigngroup(@Body() body: any, @Param('id') id: string) {
    return this.userService.assigngroup({ ...body, id });
  }
    @Post('edituser_assigngroup_bulk')
  assigngroup_bulk(@Body() body: any) {
    return this.userService.assigngroupbulk(body);
  }
  // Destructive → use DELETE verb (was GET, which is CSRF/prefetch-prone).
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  // Day 7: bulk delete (frontend calls POST /users/delete-bulk).
  @Post('delete-bulk')
  deleteUsersBulk(@Body() body: { ids: string[] }) {
    return this.userService.deleteUsers(body.ids);
  }


  
  @Post('getAllgroupscount')
  getAllgroupscount(@Body() body: any, @Query() query: any) {
    const { branchId, companyId } = body;
    return this.userService.getAllGroupsWithUserCount(branchId, companyId);
  }  @Post('allusers')
  geAllUsers(@Body() body: any, @Query() query: any) {
    const { branchId, companyId } = body;
    return this.userService.getAllUsers(branchId, companyId, query,body.type,body.groupId);
  }
  @Get('usersbirthday')
  geAllUsersbirthday(@Body() body: any, @Query() query: any) {
    const { time } = query;
    return this.userService.usersbirdthday({filter:time});
  }
  @Get('getuser/:id')
  getUserById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Get(':username')
  getUser(@Param('username') username: string) {
    return this.userService.findOne(username);
  }
    @Post('checkandverifyfields')
  checkandverifyfield( @Body() updateBranchDto: any) {
    return this.userService.checkAndVerifyFields(updateBranchDto);
  }
}


