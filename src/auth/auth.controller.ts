// import { Controller, Post, Body } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import { LoginDto } from './login.dto';
// import { RegisterDto } from './register.dto';  // Import Register DTO

// @Controller('auth')
// export class AuthController {
//   constructor(private readonly authService: AuthService) {}

//   // Register Route
//   @Post('register')
//   async register(@Body() registerDto: RegisterDto) {
//     return this.authService.register(registerDto);  // Calls register method in AuthService
//   }

//   // Login Route
//   @Post('login')
//   async login(@Body() loginDto: LoginDto) {
//     return this.authService.authenticate(loginDto);  // Calls authenticate method in AuthService
//   }
// }

import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';  // Correct import of LoginDto
import { RegisterDto } from './register.dto';  // Correct import of RegisterDto

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Register Route
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // Login Route
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.authenticate(loginDto);
  }
}
