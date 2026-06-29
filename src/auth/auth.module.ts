// import { Module } from '@nestjs/common';
// import { JwtModule } from '@nestjs/jwt';  // This should be @nestjs/jwt
// import { PassportModule } from '@nestjs/passport';
// import { AuthService } from './auth.service';
// import { AuthController } from './auth.controller';
// import { JwtStrategy } from '../auth/jwt.strategy';
// import { UserModule } from '../user/user.module';  // Ensure this is correct

// @Module({
//   imports: [
//     PassportModule.register({ defaultStrategy: 'jwt' }),
//     JwtModule.register({
//       secret: process.env.JWT_SECRET_KEY || 'secretKey',
//       signOptions: { expiresIn: '1h' },
//     }),
//     UserModule,  // Ensure the UserModule is correctly imported for user validation
//   ],
//   providers: [AuthService, JwtStrategy],
//   controllers: [AuthController],
//   exports: [JwtStrategy, PassportModule],
// })
// export class AuthModule {}


import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UserModule } from '../user/user.module';

// Fail fast: never fall back to a default/known secret (tokens could be forged).
const JWT_SECRET = process.env.JWT_SECRET_KEY;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET_KEY is not set. Add it to .env before starting the app.');
}

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    UserModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
