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
import mongoose, { Model } from 'mongoose';
import { UserDocument } from './user.entity';  // Correct import for UserDocument

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private userModel: Model<UserDocument>) {}  // Correct usage of 'User' as model

  async createUser(userDto: any): Promise<UserDocument> {
    const newUser = new this.userModel(userDto);
    return newUser.save();
  }
  async deleteUser(id: any): Promise<any> {
    // const newUser = new this.userModel(userDto);
    // return newUser.save();

    const user = await this.userModel.findOne({ _id: id });
    if (!user) {
      throw new Error('User not found');
    }
    // return await {}
    return await user.deleteOne();
  }
  async editeUser(Body: any): Promise<any> {
    const existingUser =await  this.userModel.findOne({_id:Body.id});
    if (!existingUser) {
      throw new Error('User not found');
    }
    Body.deptId=Body.department
    existingUser.set(Body); // Merge fields safely
    return await existingUser.save();
    // return newUser.save()
    // return newUser.save();
  }
  async findOne(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username });
  }

  async getAllUsers(branchId: string, companyId: string, query: any): Promise<any> {
    const matchStage: any = { branchId, companyId, role: { $ne: 'Super Admin' } };
  //  console.log(query.role,"query.department")
    if (query.department) {
      matchStage.deptId = query.department
    }
    if(query.role){
      matchStage.role = query.role
    }
    
      return this.userModel.aggregate([
        { $match: matchStage },
    
        // Convert deptId (string) to ObjectId for the join
        {
          $addFields: {
            deptIdObj: {
              $toObjectId: '$deptId'
            }
          }
        },
        {
          $lookup: {
            from: 'departments',
            localField: 'deptIdObj',
            foreignField: '_id',
            as: 'departmentInfo'
          }
        },
        { $unwind: { path: '$departmentInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            username: 1,
            email: 1,
            branchId: 1,
            companyId: 1,
            firstName:1,
            lastName:1,
            active_status:1,
            role:1,
            joining_date:1,
            date_of_birth:1,
            // add any user fields you need here
            dept_code: '$departmentInfo.dept_code',
            dept_name: '$departmentInfo.name'
          }
        }
      ]);
    }
  
  
}
