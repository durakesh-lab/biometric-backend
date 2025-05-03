// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { Strategy } from 'passport-jwt';
// import { ExtractJwt } from 'passport-jwt';
// import { JwtPayload } from './jwt.payload';  // Ensure this import is correct
 
// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor() {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       ignoreExpiration: false,
//       secretOrKey: process.env.JWT_SECRET_KEY || 'secretKey',
//     });
//   }

//   async validate(payload: JwtPayload) {
//     return { userId: payload.sub, username: payload.username };  // Correctly map the payload to the return object
//   }
// }

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';
import { JwtPayload } from './jwt.payload';  // Correct import of JwtPayload

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET_KEY || 'secretKey',
    });
  }

  async validate(payload: JwtPayload) {
    return { userId: payload.sub, username: payload.username, role: payload.role };  // Include role in validated data
  }
}
