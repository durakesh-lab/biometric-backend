// import { Injectable } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { LoginDto } from './login.dto';
// import { UserService } from '../user/user.service';  // Import UserService to create users
// import * as bcrypt from 'bcrypt';
// import { RegisterDto } from './register.dto';  // Register DTO for validation

// @Injectable()
// export class AuthService {
//   constructor(
//     private readonly jwtService: JwtService,
//     private readonly userService: UserService,  // Inject UserService for creating users
//   ) {}

//   // Validate user credentials
//   async validateUser(username: string, password: string): Promise<any> {
//     const user = await this.userService.findOne(username);
//     if (user && bcrypt.compareSync(password, user.password)) {
//       return user;
//     }
//     return null;
//   }

//   // Generate and return a JWT token after successful login
//   async login(user: any) {
//     const payload = { username: user.username, sub: user._id };
//     return {
//       access_token: this.jwtService.sign(payload),
//     };
//   }

//   // Register a new user (hash password and store user in DB)
//   async register(registerDto: RegisterDto): Promise<any> {
//     const { username, password } = registerDto;

//     // Check if the username already exists
//     const existingUser = await this.userService.findOne(username);
//     if (existingUser) {
//       throw new Error('Username already exists');
//     }

//     // Hash the password before saving
//     const hashedPassword = bcrypt.hashSync(password, 10);

//     // Create the new user
//     const newUser = await this.userService.createUser({
//       username,
//       password: hashedPassword,
//     });

//     // Optionally, return the newly created user, or you could return a JWT token
//     return newUser;
//   }

//   // Authenticate the login credentials
//   async authenticate(loginDto: LoginDto) {
//     const user = await this.validateUser(loginDto.username, loginDto.password);
//     if (!user) {
//       throw new Error('Invalid credentials');
//     }
//     return this.login(user);
//   }
// }
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';  // Correct import for UserService
import * as bcrypt from 'bcrypt';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,  // Correct injection of UserService
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findOne(username);
    if(user?.active_status=="Inactive"){
      throw new UnauthorizedException('User is inactive');
      // return {
      //   statusCode: 401,
      //   message: 'User is inactive',
      // };
    }
    if (user && bcrypt.compareSync(password, user.password)) {
      return user;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: any): Promise<any> {
    const { username, password, role,   firstName,
      active_status,
      email,
      lastName,
      joining_date,
      date_of_birth,
      branchId,
      companyId} = registerDto;

    const existingUser = await this.userService.findOne(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = await this.userService.createUser({
      username,
      password: hashedPassword,
      role,  // Include role in user creation
      firstName,
      active_status,
      email,
      lastName,
      joining_date,
      date_of_birth,
      branchId,
      companyId
    });

    return newUser;
  }

  async authenticate(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    // if (user.statusCode==401){
    //   return user
    // }
    return this.login(user);
  }
}
