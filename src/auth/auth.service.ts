
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


import { Injectable, ConflictException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    @InjectConnection() private readonly connection: Connection
  ) { }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findOne(username);
    if (user?.active_status == "Inactive") {
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
    const payload = {
      branchId: user.branchId,
      companyId: user.companyId,
      username: user.username,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      employeeCode: user.employeeCode || '',
      sub: user._id,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '15m' }), // 15-minute access token
      refresh_token: this.jwtService.sign(
        { sub: user._id, username: user.username, type: 'refresh' },
        { expiresIn: '7d' }, // 7-day refresh token
      ),
    };
  }

  /** Issue a fresh access token from a valid refresh token. */
  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');
    let decoded: any;
    try {
      decoded = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException('Not a refresh token');
    }
    // Re-load the user so role/org changes (or deactivation) take effect.
    const user: any = await this.userService.findOne(decoded.username);
    if (!user || user.active_status === 'Inactive') {
      throw new UnauthorizedException('User no longer active');
    }
    return this.login(user);
  }

  // Roles a caller is NEVER allowed to self-assign via public registration.
  private static readonly ALLOWED_SELF_ROLE = 'Employee';

  /**
   * Register a user.
   * @param registerDto  the submitted fields
   * @param allowRole    only true when an authenticated admin (Super Admin / HR Admin)
   *                     is creating the user. Public callers can NEVER set a role.
   */
  async register(registerDto: RegisterDto, allowRole = false): Promise<any> {
    const { username, password, role, firstName,
      active_status,
      email,
      lastName,
      joining_date,
      date_of_birth,
      branchId,
      department,
      companyId, gender, mobile } = registerDto;

    const existingUser = await this.userService.findOne(username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // SECURITY: never trust a client-supplied role on public registration.
    // Public signup is forced to 'Employee'; only an admin route may set a role.
    // 'Super Admin' can never be created here at all (bootstrap/seed only).
    let finalRole = AuthService.ALLOWED_SELF_ROLE;
    if (allowRole && role && role !== 'Super Admin') {
      finalRole = role;
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = await this.userService.createUser({
      username,
      password: hashedPassword,
      role: finalRole,
      firstName,
      active_status,
      email,
      lastName,
      joining_date,
      date_of_birth,
      branchId,
      companyId,
      deptId: department,
      gender, mobile
    });

    return newUser;
  }

  /** Admin-only path that is permitted to set the role (gated by guards in the controller). */
  async adminCreateUser(registerDto: RegisterDto): Promise<any> {
    return this.register(registerDto, true);
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

    // Only send email and update DB if new code is needed.
    // Null-guard: on a fresh DB the settings doc may not exist → treat 2FA as OFF (don't crash).
    if (settings?.datavalue) {
      // SMTP credentials are a SINGLE server-side secret (the system sender mailbox),
      // read from .env — NOT from the DB and NOT entered per-user in the UI.
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      if (!smtpUser || !smtpPass) {
        throw new InternalServerErrorException(
          '2FA is enabled but SMTP_USER / SMTP_PASS are not configured on the server.',
        );
      }
      try {
        // Configure nodemailer (Gmail example) from server env.
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass, // Gmail App Password, stored only in .env
          },
        });

        const mailOptions = {
          from: smtpUser,
          to: existingUser.email, // the OTP goes TO the user logging in
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
              codeAttempts: 0, // reset the brute-force counter for the new code
            },
          },
          { upsert: true }
        );
      } catch (error) {
        throw new InternalServerErrorException('Failed to send verification email');
      }
    }
    else {
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
    const usercheck = await this.validateUser(body.username, body.password);
    if (!usercheck) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userCollection = this.connection.collection('users');
    const user: any = await userCollection.findOne({ username: usercheck.username });

    // No code generated → nothing to verify.
    if (!user?.verificationCode || !user?.codeGeneratedAt) {
      throw new UnauthorizedException('No active verification code. Please log in again.');
    }

    // 1) Expiry: code is only valid for 5 minutes.
    const ageMs = Date.now() - new Date(user.codeGeneratedAt).getTime();
    if (ageMs > 5 * 60 * 1000) {
      await userCollection.updateOne(
        { username: usercheck.username },
        { $unset: { verificationCode: '', codeGeneratedAt: '', codeAttempts: '' } },
      );
      throw new UnauthorizedException('Verification code expired. Please log in again.');
    }

    // 2) Brute-force cap: max 5 attempts, then invalidate the code.
    const attempts = (user.codeAttempts || 0) + 1;
    if (attempts > 5) {
      await userCollection.updateOne(
        { username: usercheck.username },
        { $unset: { verificationCode: '', codeGeneratedAt: '', codeAttempts: '' } },
      );
      throw new UnauthorizedException('Too many attempts. Please log in again to get a new code.');
    }

    // 3) Wrong code → record the attempt, reject.
    if (String(user.verificationCode) !== String(body.code)) {
      await userCollection.updateOne(
        { username: usercheck.username },
        { $set: { codeAttempts: attempts } },
      );
      return { status: false, message: 'invalid code' };
    }

    // 4) Correct → clear the code so it can't be reused, then issue the token.
    await userCollection.updateOne(
      { username: usercheck.username },
      { $unset: { verificationCode: '', codeGeneratedAt: '', codeAttempts: '' } },
    );
    const w = await this.login(usercheck);
    return { status: true, message: 'Code Verified Successfully', data: usercheck, ...w };
  }

}
