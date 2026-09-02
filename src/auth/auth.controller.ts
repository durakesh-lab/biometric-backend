

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


import { Controller, Post, Body, UseGuards, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

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

  // Helper to set HttpOnly refresh_token cookie (optional / fallback)
  private setRefreshCookie(res: Response, token?: string) {
    if (token) {
      res.cookie('refresh_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        // maxAge: 1 * 60 * 1000, // 1 min for testing
      });
    }
  }

  // Tight limit on auth: 5 attempts / minute / IP (brute-force defence).
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result: any = await this.authService.authenticate(loginDto);
    this.setRefreshCookie(res, result?.refresh_token);
    return result;
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('verifycode')
  async verifycode(@Body() loginDto: any, @Res({ passthrough: true }) res: Response) {
    const result: any = await this.authService.verifycode(loginDto);
    this.setRefreshCookie(res, result?.refresh_token);
    return result;
  }

  // Exchange a valid refresh token for a new access token (avoids early logout).
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('refresh')
  async refresh(
    @Body('refresh_token') bodyRefreshToken: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieToken = req.headers.cookie?.match(/refresh_token=([^;]+)/)?.[1];
    const refreshToken = bodyRefreshToken || cookieToken || '';
    const result: any = await this.authService.refresh(refreshToken);
    this.setRefreshCookie(res, result?.refresh_token);
    return result;
  }
}
