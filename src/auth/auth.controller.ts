

// import { Controller, Post, Body } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import { LoginDto } from './login.dto';  // Correct import of LoginDto
// import { RegisterDto } from './register.dto';  // Correct import of RegisterDto

// @Controller('auth')
// export class AuthController {
//   constructor(private readonly authService: AuthService) {}

//   // Register Route
//   @Post('register')
//   async register(@Body() registerDto: RegisterDto) {
//     return this.authService.register(registerDto);
//   }

//   // Login Route
//   @Post('login')
//   async login(@Body() loginDto: LoginDto) {
//     return this.authService.authenticate(loginDto);
//   }
// }


import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── PUBLIC self-registration is DISABLED by design. ──
  // This is an admin-managed HR/attendance system: users do NOT sign themselves up.
  // Accounts are created by an admin via POST /auth/admin/create-user (below) or the
  // app's "Add User" screen. Re-enable this only if you intentionally want public
  // self-signup (role would stay forced to 'Employee' for security).
  // @Post('register')
  // async register(@Body() registerDto: RegisterDto) {
  //   return this.authService.register(registerDto);
  // }

  // ADMIN-only create-user — may set any role except Super Admin. Gated by guards.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Super Admin', 'HR Admin')
  @Post('admin/create-user')
  async adminCreateUser(@Body() registerDto: RegisterDto) {
    return this.authService.adminCreateUser(registerDto);
  }

  // Tight limit on auth: 5 attempts / minute / IP (brute-force defence).
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.authenticate(loginDto);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('verifycode')
  async verifycode(@Body() loginDto: any) {
    return this.authService.verifycode(loginDto);
  }

  // Exchange a valid refresh token for a new access token (avoids early logout).
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }
}
