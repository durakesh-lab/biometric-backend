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
    // Extract query parameters
    const {
        page = 1,
        page_size = 10,
        search = '',
        ordering = '',
        firstName = '',
        lastName = '',
        email = '',
        role = '',
        department = '',
        active_status = ''
    } = query;

    // Base filter
    const filter: any = { 
        branchId, 
        companyId, 
        role: { $ne: 'Super Admin' } 
    };

    // General search across multiple fields
    if (search) {
        const searchRegex = new RegExp(search, 'i');
        filter.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex },
            { role: searchRegex }
        ];
    }

    // Individual field filters
    if (firstName) filter.firstName = new RegExp(firstName, 'i');
    if (lastName) filter.lastName = new RegExp(lastName, 'i');
    if (email) filter.email = new RegExp(email, 'i');
    if (role) filter.role = role; // Exact match for role
    if (department) filter.deptId = department; // Exact match for department
    if (active_status) filter.active_status = active_status; // Exact match for status

    // Sorting
    let sort = {};
    if (ordering) {
        const sortDirection = ordering.startsWith('-') ? -1 : 1;
        const sortField = ordering.startsWith('-') ? ordering.substring(1) : ordering;
        sort = { [sortField]: sortDirection };
    }

    // Pagination
    const skip = (page - 1) * page_size;
    const limit = parseInt(page_size);

    // Aggregation pipeline for joining with departments
    const pipeline: any[] = [
        { $match: filter },
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
                firstName: 1,
                lastName: 1,
                active_status: 1,
                role: 1,
                joining_date: 1,
                date_of_birth: 1,
                dept_code: '$departmentInfo.dept_code',
                dept_name: '$departmentInfo.name'
            }
        }
    ];

    // Count total documents (before pagination)
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'total' });
    const countResult = await this.userModel.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Apply sorting and pagination
    if (Object.keys(sort).length > 0) {
        pipeline.push({ $sort: sort });
    }
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute the query
    const data = await this.userModel.aggregate(pipeline);

    return {
        data,
        count: total,
        page: parseInt(page),
        page_size: parseInt(page_size),
        total_pages: Math.ceil(total / limit)
    };
}
  
  
}
