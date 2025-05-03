// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { User, UserDocument } from './user.entity';  // Correct import for UserDocument

// @Injectable()
// export class UserService {
//   constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

//   async createUser(userDto: any): Promise<User> {
//     const newUser = new this.userModel(userDto);
//     return newUser.save();
//   }

//   async findOne(username: string): Promise<User | null> {
//     return this.userModel.findOne({ username });
//   }
// }

// // user.service.ts
// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { User, UserDocument } from './user.entity';  // Make sure you are importing the correct user entity

// @Injectable()
// export class UserService {
//   constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

//   // Method to create a user
//   async createUser(userDto: any): Promise<User> {
//     const newUser = new this.userModel(userDto);
//     return newUser.save();
//   }

//   // Method to find a user by username
//   async findOne(username: string): Promise<User | null> {
//     return this.userModel.findOne({ username });
//   }
// }


import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from './user.entity';  // Correct import for UserDocument

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private userModel: Model<UserDocument>) {}  // Correct usage of 'User' as model

  async createUser(userDto: any): Promise<UserDocument> {
    const newUser = new this.userModel(userDto);
    return newUser.save();
  }

  async findOne(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username });
  }
}
