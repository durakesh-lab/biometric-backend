
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
import { Department } from 'src/department/department.schema';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    @InjectConnection() private readonly connection: Connection
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
    const payload = { username: user.username,firstName: user.firstName,  sub: user._id, role: user.role };
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
      department,
      companyId,gender,mobile} = registerDto;

    const existingUser = await this.userService.findOne(username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // const existingEmail = await this.userService.findByEmail(email);
    // if (existingEmail) {
    //   throw new ConflictException('Email already exists');
    // }

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
      companyId,
      deptId:department,
      gender,mobile
    });

    return newUser;
  }

  async authenticate(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const settingsCollection = this.connection.collection('settings');
  const settings:any = await settingsCollection.findOne({type:"2factor-authentication"}); // or use `find({}).toArray()` if multiple
      const usercollection = this.connection.collection('users');
  const users:any = await settingsCollection.findOne({username:loginDto.username}); 
  // return settings
    // if (user.statusCode==401){
    //   return user
    // }
    let w=await this.login(user)

// After w = await this.login(user)
const userCollection = this.connection.collection('users');

// Check if code already exists and is still valid (within 5 minutes)
const existingUser: any = await userCollection.findOne({ username: loginDto.username });

const currentTime = new Date().getTime();
let verificationCode = '';
let shouldSendNewCode = true;

if (
  existingUser &&
  existingUser.verificationCode &&
  existingUser.codeGeneratedAt &&
  currentTime - new Date(existingUser.codeGeneratedAt).getTime() < 5 * 60 * 1000
) {
  // Code still valid
  verificationCode = existingUser.verificationCode;
  shouldSendNewCode = false;
} else {
  // Generate new 6-digit code
  verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Store code and timestamp in DB
  await userCollection.updateOne(
    { username: loginDto.username },
    {
      $set: {
        verificationCode,
        codeGeneratedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

// Send Email only if needed
if (shouldSendNewCode) {
  // Configure nodemailer (Gmail example)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user:"rajatgour98@gmail.com",
      pass: 'agzv qdrj iiug zhom', // use App Password (if 2FA enabled)
    },
  });

  const mailOptions = {
    from:  "rajatgour98@gmail.com",
    to:'g.rajat@onebillionideas.io',
    subject: 'Your 2FA Verification Code',
    text: `Your verification code For Biometric Login is ${verificationCode}. It is valid for 5 minutes.`,
  };

  await transporter.sendMail(mailOptions);
}

return {
  ...w,
  multifactorauth: settings?.datavalue || false,
  message: 'Verification code sent to your email.',
};
  }
}
