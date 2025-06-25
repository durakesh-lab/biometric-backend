
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


import { Injectable, ConflictException, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
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
    const payload = {branchId:user.branchId,companyId:user.companyId, username: user.username,firstName: user.firstName,  sub: user._id, role: user.role };
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
  const settings: any = await settingsCollection.findOne({ type: "2factor-authentication" });
  const userCollection = this.connection.collection('users');
  const existingUser: any = await userCollection.findOne({ username: loginDto.username });

  const currentTime = new Date().getTime();
  let verificationCode = '';
  let shouldSendNewCode = true;

  // Check if existing code is still valid
  if (
    existingUser &&
    existingUser.verificationCode &&
    existingUser.codeGeneratedAt &&
    currentTime - new Date(existingUser.codeGeneratedAt).getTime() < 5 * 60 * 1000
  ) {
    verificationCode = existingUser.verificationCode;
    shouldSendNewCode = false;
  } else {
    verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  }

  // let w = await this.login(user);

  // Only send email and update DB if new code is needed
  if (settings.datavalue) {
    try {
      // Configure nodemailer (Gmail example)
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: settings.email,
          // user:settings.email,
          pass: settings.appPassword, // use App Password (if 2FA enabled)
        },
      });

      const mailOptions = {
        from:  settings.email,
        to: existingUser.email,
        subject: 'Your 2FA Verification Code',
        text: `Your verification code For Biometric Login is ${verificationCode}. It is valid for 5 minutes.`,
      };

      // Send email first
      await transporter.sendMail(mailOptions);

      // Only update DB if email was sent successfully
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
    } catch (error) {
      throw new InternalServerErrorException('Failed to send verification email');
    }
  }
  else{
     var w = await this.login(user);
       return {
        ...w,
    multifactorauth: settings?.datavalue || false,
    message: shouldSendNewCode 
      ? 'Verification code sent to your email.' 
      : 'Existing verification code still valid.',
  };
  }

  return {
    multifactorauth: settings?.datavalue || false,
    message: shouldSendNewCode 
      ? 'Verification code sent to your email.' 
      : 'Existing verification code still valid.',
  };
}


async verifycode(body: any) {
  try {
     const usercheck = await this.validateUser(body.username, body.password);
      

    // const decoded = this.jwtService.verify(body.token, {
    //   secret: 'secretKey', // or your secret_key variable
    // });
 

    let userdata:any=await  this.userService.findOne(usercheck.username)
const user = userdata.toObject();
if(user.verificationCode==body.code){
  let w = await this.login(usercheck);
   return {status:true,message:"Code Verified Successfully",data:usercheck,...w};
}else{
  return {status:false,message:"invalid code"}
}
// console.log(user.verificationCode,6777777);
  } catch (error) {
    console.error('Invalid token', error.message);
    throw new UnauthorizedException('Token verification failed');
  }
}

}
