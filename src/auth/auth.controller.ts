

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


import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.authenticate(loginDto);
  }
}
