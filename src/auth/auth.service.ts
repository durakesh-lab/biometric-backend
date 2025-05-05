
// import { Injectable } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { UserService } from '../user/user.service';  // Correct import for UserService
// import * as bcrypt from 'bcrypt';
// import { LoginDto } from './login.dto';
// import { RegisterDto } from './register.dto';

// @Injectable()
// export class AuthService {
//   constructor(
//     private readonly jwtService: JwtService,
//     private readonly userService: UserService,  // Correct injection of UserService
//   ) {}

//   async validateUser(username: string, password: string): Promise<any> {
//     const user = await this.userService.findOne(username);
//     if (user && bcrypt.compareSync(password, user.password)) {
//       return user;
//     }
//     return null;
//   }

//   async login(user: any) {
//     const payload = { username: user.username, sub: user._id, role: user.role };
//     return {
//       access_token: this.jwtService.sign(payload),
//     };
//   }

//   async register(registerDto: RegisterDto): Promise<any> {
//     const { username, password, role } = registerDto;

//     const existingUser = await this.userService.findOne(username);
//     if (existingUser) {
//       throw new Error('Username already exists');
//     }

//     const hashedPassword = bcrypt.hashSync(password, 10);

//     const newUser = await this.userService.createUser({
//       username,
//       password: hashedPassword,
//       role,  // Include role in user creation
//     });

//     return newUser;
//   }

//   async authenticate(loginDto: LoginDto) {
//     const user = await this.validateUser(loginDto.username, loginDto.password);
//     if (!user) {
//       throw new Error('Invalid credentials');
//     }
//     return this.login(user);
//   }
// }

import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findOne(username);
    if (!user) return null;

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    return isPasswordValid ? user : null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: RegisterDto): Promise<any> {
    const { username, password, email, role } = registerDto;

    if (!username || !password || !email || !role) {
      throw new BadRequestException('All fields (username, email, password, role) are required');
    }

    const existingUser = await this.userService.findOne(username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const existingEmail = await this.userService.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = await this.userService.createUser({
      username,
      email,
      password: hashedPassword,
      role,
    });

    return newUser;
  }

  async authenticate(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.login(user);
  }
}
