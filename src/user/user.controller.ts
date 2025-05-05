

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
import { Controller, Get, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':username')
  async getUser(@Param('username') username: string) {
    return this.userService.findOne(username);
  }

  // ✅ Super Admin only
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllUsers(@Req() req: any) {
    const user = req.user;

    if (user.role !== 'Super Admin') {
      throw new ForbiddenException('Only Super Admins can access all users');
    }

    return this.userService.findAllUsers();
  }
}
