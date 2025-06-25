
// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import mongoose, { Model } from 'mongoose';
// import { UserDocument } from './user.entity';  // Correct import for UserDocument

// @Injectable()
// export class UserService {
//   constructor(@InjectModel('User') private userModel: Model<UserDocument>) {}  // Correct usage of 'User' as model

//   async createUser(userDto: any): Promise<UserDocument> {
//     const newUser = new this.userModel(userDto);
//     return newUser.save();
//   }
//   async deleteUser(id: any): Promise<any> {
//     // const newUser = new this.userModel(userDto);
//     // return newUser.save();

//     const user = await this.userModel.findOne({ _id: id });
//     if (!user) {
//       throw new Error('User not found');
//     }
//     // return await {}
//     return await user.deleteOne();
//   }
//   async editeUser(Body: any): Promise<any> {
//     const existingUser =await  this.userModel.findOne({_id:Body.id});
//     if (!existingUser) {
//       throw new Error('User not found');
//     }
//     Body.deptId=Body.department
//     existingUser.set(Body); // Merge fields safely
//     return await existingUser.save();
//     // return newUser.save()
//     // return newUser.save();
//   }
//   async findOne(username: string): Promise<UserDocument | null> {
//     return this.userModel.findOne({ username });
//   }

//   async getAllUsers(branchId: string, companyId: string, query: any): Promise<any> {
//     // Extract query parameters
//     const {
//         page = 1,
//         page_size = 10,
//         search = '',
//         ordering = '',
//         firstName = '',
//         lastName = '',
//         email = '',
//         role = '',
//         department = '',
//         active_status = ''
//     } = query;

//     // Base filter
//     const filter: any = { 
//         branchId, 
//         companyId, 
//         role: { $ne: 'Super Admin' } 
//     };

//     // General search across multiple fields
//     if (search) {
//         const searchRegex = new RegExp(search, 'i');
//         filter.$or = [
//             { firstName: searchRegex },
//             { lastName: searchRegex },
//             { email: searchRegex },
//             { role: searchRegex }
//         ];
//     }

//     // Individual field filters
//     if (firstName) filter.firstName = new RegExp(firstName, 'i');
//     if (lastName) filter.lastName = new RegExp(lastName, 'i');
//     if (email) filter.email = new RegExp(email, 'i');
//     if (role) filter.role = role; // Exact match for role
//     if (department) filter.deptId = department; // Exact match for department
//     if (active_status) filter.active_status = active_status; // Exact match for status

//     // Sorting
//     let sort = {};
//     if (ordering) {
//         const sortDirection = ordering.startsWith('-') ? -1 : 1;
//         const sortField = ordering.startsWith('-') ? ordering.substring(1) : ordering;
//         sort = { [sortField]: sortDirection };
//     }

//     // Pagination
//     const skip = (page - 1) * page_size;
//     const limit = parseInt(page_size);

//     // Aggregation pipeline for joining with departments
//     const pipeline: any[] = [
//         { $match: filter },
//         {
//             $addFields: {
//                 deptIdObj: {
//                     $toObjectId: '$deptId'
//                 }
//             }
//         },
//         {
//             $lookup: {
//                 from: 'departments',
//                 localField: 'deptIdObj',
//                 foreignField: '_id',
//                 as: 'departmentInfo'
//             }
//         },
//         { $unwind: { path: '$departmentInfo', preserveNullAndEmptyArrays: true } },
//         {
//             $project: {
//                 _id: 1,
//                 username: 1,
//                 email: 1,
//                 branchId: 1,
//                 companyId: 1,
//                 firstName: 1,
//                 lastName: 1,
//                 active_status: 1,
//                 role: 1,
//                 joining_date: 1,
//                 date_of_birth: 1,
//                 dept_code: '$departmentInfo.dept_code',
//                 dept_name: '$departmentInfo.name'
//             }
//         }
//     ];

//     // Count total documents (before pagination)
//     const countPipeline = [...pipeline];
//     countPipeline.push({ $count: 'total' });
//     const countResult = await this.userModel.aggregate(countPipeline);
//     const total = countResult[0]?.total || 0;

//     // Apply sorting and pagination
//     if (Object.keys(sort).length > 0) {
//         pipeline.push({ $sort: sort });
//     }
//     pipeline.push({ $skip: skip });
//     pipeline.push({ $limit: limit });

//     // Execute the query
//     const data = await this.userModel.aggregate(pipeline);

//     return {
//         data,
//         count: total,
//         page: parseInt(page),
//         page_size: parseInt(page_size),
//         total_pages: Math.ceil(total / limit)
//     };
// }
  
  
// }


// / user.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { UserDocument } from './user.entity';
import * as xlsx from 'xlsx';
import * as bcrypt from 'bcrypt';
import { Company } from 'src/company/company.schema';
import { Branch } from 'src/branch/branch.schema';
import { Department } from 'src/department/department.schema';
import { Group } from 'src/groups/groups.schema';
import * as moment from 'moment';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private userModel: Model<UserDocument>,@InjectModel(Company.name) private companyModel: Model<Company>,@InjectModel(Branch.name) private BranchModel: Model<Branch>,@InjectModel(Department.name) private deptModel: Model<Department>,@InjectModel(Group.name) private groupModel: Model<Group>) {}

  async createUser(userDto: any): Promise<UserDocument> {
    const newUser = new this.userModel(userDto);
    return newUser.save();
  }

  async deleteUser(id: string): Promise<any> {
    const user = await this.userModel.findById(id);
    if (!user) throw new Error('User not found');
    return user.deleteOne();
  }

  async editUser(body: any): Promise<any> {
    const existingUser = await this.userModel.findById(body.id);
    if (!existingUser) throw new Error('User not found');
    body.deptId = body.department;
    existingUser.set(body);
    return existingUser.save();
  }
  async assigngroup(body: any): Promise<any> {
    const existingUser = await this.userModel.findById(body.id);
    if (!existingUser) throw new Error('User not found');
    existingUser.set(body);
    return existingUser.save();
  }
    async assigngroupbulk(body: any): Promise<any> {
      let data =await Promise.all(body.userIds.map(async (e,i)=>{
              const existingUser = await this.userModel.findById(e);
    if (!existingUser) throw new Error('User not found');
    existingUser.set({groupId:body.groupId});
    return existingUser.save();
      }))
      return data
   
  }
  async findOne(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username });
  }

  async checkAndVerifyFields(body: any): Promise<{ status: boolean; message?: string }> {
    try {
      if (body.field === "username") {
        const check = await this.userModel.find({ username: body.username });
        if (check.length) {
          return { status: false, message: "Username already exists" };
        }
        return { status: true };
      } else if (body.field === "email") {
        const check = await this.userModel.find({ email: body.email });
        if (check.length) {
          return { status: false, message: "Email already exists" };
        }
        return { status: true };
      }
      return { status: false, message: "Invalid field specified" };
    } catch (error) {
      throw new Error('Error verifying fields');
    }
  }




async usersbirdthday(body: { filter: 'today' | 'this_week' | 'this_month' | 'this_year' }): Promise<{ status: boolean; message?: string; data?: any }> {
  try {
    const filter = body.filter;
    const today = moment();

    let users = await this.userModel.find({});
    let filteredUsers:any[] = [];

    users.forEach(user => {
      if (!user.date_of_birth) return;

      const dob = moment(user.date_of_birth);
      const birthdayThisYear = moment({ 
        year: today.year(), 
        month: dob.month(), 
        day: dob.date() 
      });

      switch (filter) {
        case 'today':
          if (today.isSame(birthdayThisYear, 'day')) {
            filteredUsers.push(user);
          }
          break;

        case 'this_week':
          const startOfWeek = today.clone().startOf('week');
          const endOfWeek = today.clone().endOf('week');
          if (birthdayThisYear.isBetween(startOfWeek, endOfWeek, 'day', '[]')) {
            filteredUsers.push(user);
          }
          break;

 case 'this_month':
  if (
    birthdayThisYear.month() === today.month() &&
    birthdayThisYear.isSameOrAfter(today, 'day')
  ) {
    filteredUsers.push(user);
  }
  break;

        case 'this_year':
  if (birthdayThisYear.isSameOrAfter(today, 'day')) {
    filteredUsers.push(user);
  }
  break;

      }
    });

    return { status: true, data: filteredUsers };

  } catch (error) {
    console.error(error);
    throw new Error('Error verifying fields');
  }
}




async findById(id: string): Promise<any> {
  const objectId = new Types.ObjectId(id);

  const result = await this.userModel.aggregate([
    {
      $match: { _id: objectId },
    },
    {
      // Convert deptId (string) to ObjectId before lookup
      $addFields: {
        deptObjId: { $toObjectId: '$deptId' },
      },
    },
    {
      $lookup: {
        from: 'departments',
        localField: 'deptObjId',
        foreignField: '_id',
        as: 'department',
      },
    },
    { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        username: 1,
        email: 1,
        firstName: 1,
        lastName: 1,
        deptId: 1,
        role:1,
        active_status:1,
        joining_date:1,
        date_of_birth:1,
        mobile:1,
        department: {
          name: 1,
          dept_code: 1,
          branchId: 1,
        },
      },
    },
  ]);

  return result[0] || null;
}


async importUsers(filePath: string): Promise<any> {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet]);
    
    // Process all rows and hash passwords
    const users = await Promise.all(data.map(async (row: any) => {
        if (row.password && row.username && row["Branch Code"]&& row["Company Id"] && row['Department Code']) {
            return {
                username: row.username,
                password: await bcrypt.hash(row.password.toString(), 10),
                mobile: row.Mobile,
                gender: row.Gender,
                email: row.Email,
                firstName: row["First Name"],
                lastName: row["Last Name"],
                role: row.role,
                active_status: row['active status']=="Inactive" ? "Inactive"  : 'Active',
                branchCode: row["Branch Code"],
                companyId: row["Company Id"],
                deptCode: row['Department Code'],
                joining_date: row['Date of Joining'],
                date_of_birth: row['date of birth'],
            };
        }
        return null; // Use null instead of false for better semantics
    }));

    // Filter out null entries and check for existing users
    const validUsers = users.filter(user => user !== null);
    // Check for existing users in parallel

    const existingChecks = await Promise.all(
        validUsers.map(async (user: any) => {
            const existingUser = await this.userModel.findOne({ 
                $or: [
                    { username: user.username },
                    { email: user.email }
                ]
            });

            if(!existingUser){

              let checkcompanyCode=await this.companyModel.findOne({companyId:user.companyId})
              if(checkcompanyCode){
                user.companyId=checkcompanyCode._id
             let checkbranchCode=await this.BranchModel.findOne({branchCode:user.branchCode})
           if(checkbranchCode){

                 delete user.branchCode
                user.branchId=checkbranchCode._id
            let checkdeptCode=await this.deptModel.findOne({dept_code:user.deptCode})
                if(checkdeptCode){
                    delete user.deptCode
                    
               user.deptId=checkdeptCode._id
                return  user
                }
                else{
                  return null
                }
                // return existingUser ? null : user;
                 
                
           }else{
               return null
           }
              }
              else{
                return null
              }

            }
            else{
              return null
            }
            
        })
    );
                // console.log(checkbranchCode,'existingUsers#######')

// console.log(existingChecks,"existingChecksexistingChecks#########$$$$$$")
    // Filter out users that already exist
    const newUsers = existingChecks.filter(user => user !== null);
    // console.log(newUsers,"validUsersvalidUsersvalidUsers#########")
  try {
      let saved= await this.userModel.insertMany(newUsers);
      return {status:true,message:"data inserted successfully",count:newUsers.length}
  } catch (error) {
     return {status:false,message:error.message}

  }
 
}

async getAllUsers(branchId: string, companyId: string, query: any, type: any,groupId:any): Promise<any> {
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
...(groupId && { groupId }),
      branchId, 
      companyId, 
      role: { $ne: 'Super Admin' } 
    };
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { mobile: Number(search) || null },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { role: searchRegex },
      ];
    }

    // Individual field filters
    if (firstName) filter.firstName = new RegExp(firstName, 'i');
    if (lastName) filter.lastName = new RegExp(lastName, 'i');
    if (email) filter.email = new RegExp(email, 'i');
    if (role) filter.role = role;
    if (department) filter.deptId = department;
    if (active_status) filter.active_status = active_status;

    // Sorting
    const sort: any = {};
    if (ordering) {
      const sortDirection = ordering.startsWith('-') ? -1 : 1;
      const sortField = ordering.startsWith('-') ? ordering.substring(1) : ordering;
      sort[sortField] = sortDirection;
    }

    const skip = (page - 1) * page_size;
    const limit = parseInt(page_size);

    const pipeline: any[] = [
      { $match: filter },
      {
        $addFields: {
          deptIdObj: {
            $convert: {
              input: '$deptId',
              to: 'objectId',
              onError: null,
              onNull: null
            }
          },
          branchIdObj: {
            $convert: {
              input: '$branchId',
              to: 'objectId',
              onError: null,
              onNull: null
            }
          },
          companyIdObj: {
            $convert: {
              input: '$companyId',
              to: 'objectId',
              onError: null,
              onNull: null
            }
          },
          // Add groupIdObj conversion if type is "group"
          ...(type === 'group' ? {
            groupIdObj: {
              $convert: {
                input: '$groupId',
                to: 'objectId',
                onError: null,
                onNull: null
              }
            }
          } : {})
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
        $lookup: {
          from: 'branches',
          localField: 'branchIdObj',
          foreignField: '_id',
          as: 'branchesInfo'
        }
      },
      { $unwind: { path: '$branchesInfo', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'companies',
          localField: 'companyIdObj',
          foreignField: '_id',
          as: 'companiesInfo'
        }
      },
      { $unwind: { path: '$companiesInfo', preserveNullAndEmptyArrays: true } },
      // Add group lookup if type is "group"
      ...(type === 'group' ? [
        {
          $lookup: {
            from: 'groups',
            localField: 'groupIdObj',
            foreignField: '_id',
            as: 'groupInfo'
          }
        },
        { $unwind: { path: '$groupInfo', preserveNullAndEmptyArrays: true } }
      ] : []),
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
          gender: 1,
          mobile: 1,
          dept_code: '$departmentInfo.dept_code',
          dept_name: '$departmentInfo.name',
          branchCode: '$branchesInfo.branchCode',
          company_Id: '$companiesInfo.companyId',
          // Include group fields if type is "group"
          ...(type === 'group' ? {
            groupId: '$groupId',
            groupName: '$groupInfo.name',
            groupColor: '$groupInfo.color',
            groupStartTime: '$groupInfo.startTime',
            groupEndTime: '$groupInfo.endTime',
            groupDescription: '$groupInfo.description'
          } : {})
        }
      }
    ];

    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'total' });
    
    const countResult = await this.userModel.aggregate(countPipeline).exec();
    const total = countResult[0]?.total || 0;

    if (Object.keys(sort).length > 0) {
      pipeline.push({ $sort: sort });
    }
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const data = await this.userModel.aggregate(pipeline).exec();

    return {
      data,
      count: total,
      page: parseInt(page),
      page_size: parseInt(page_size),
      total_pages: Math.ceil(total / limit)
    };
  }
  

async getAllGroupsWithUserCount(branchId: string, companyId: string): Promise<any> {
  const pipeline: any[] = [
    // First, get all users that have a groupId and match the branch/company
    {
      $match: {
        branchId,
        companyId,
        role: { $ne: 'Super Admin' },
        groupId: { $exists: true, $ne: null }
      }
    },
    // Convert groupId string to ObjectId for lookup
    {
      $addFields: {
        groupIdObj: {
          $convert: {
            input: '$groupId',
            to: 'objectId',
            onError: null,
            onNull: null
          }
        }
      }
    },
    // Lookup group details
    {
      $lookup: {
        from: 'groups',
        localField: 'groupIdObj',
        foreignField: '_id',
        as: 'groupInfo'
      }
    },
    // Unwind the group info (we only want users with valid groups)
    {
      $unwind: {
        path: '$groupInfo',
        preserveNullAndEmptyArrays: false // Exclude users without matching groups
      }
    },
    // Group by groupId to count users and get group details
    {
      $group: {
        _id: '$groupId',
        groupName: { $first: '$groupInfo.name' },
        groupColor: { $first: '$groupInfo.color' },
        startTime: { $first: '$groupInfo.startTime' },
        endTime: { $first: '$groupInfo.endTime' },
        description: { $first: '$groupInfo.description' },
        userCount: { $sum: 1 }
      }
    },
    // Project to clean up the output
    {
      $project: {
        _id: 0,
        groupId: '$_id',
        groupName: 1,
        groupColor: 1,
        startTime: 1,
        endTime: 1,
        description: 1,
        userCount: 1
      }
    },
    // Sort by group name
    {
      $sort: {
        groupName: 1
      }
    }
  ];

  const data = await this.userModel.aggregate(pipeline).exec();

  // Also get groups that exist but have no users assigned
  const allGroups = await this.groupModel.find({
    _id: { $exists: true }
  }).lean();

  const groupsWithUsers = new Set(data.map(g => g.groupId.toString()));
  const groupsWithoutUsers = allGroups.filter(
    g => !groupsWithUsers.has(g._id.toString())
  ).map(g => ({
    groupId: g._id,
    groupName: g.name,
    groupColor: g.color,
    startTime: g.startTime,
    endTime: g.endTime,
    description: g.description,
    userCount: 0
  }));

  const combinedResults = [...data, ...groupsWithoutUsers];

  return {
    data: combinedResults,
    count: combinedResults.length
  };
}


  async deleteUsers(ids: string[]): Promise<{ message: string; deletedCount?: number }> {
    const objectIds: Types.ObjectId[] = [];
    const invalidIds: string[] = [];
    
    for (const id of ids) {
      if (Types.ObjectId.isValid(id)) {
        objectIds.push(new Types.ObjectId(id));
      } else {
        invalidIds.push(id);
      }
    }

    if (invalidIds.length) {
      throw new BadRequestException(`Invalid user IDs: ${invalidIds.join(', ')}`);
    }

    const result = await this.userModel.deleteMany({
      _id: { $in: objectIds }
    }).exec();

    if (result.deletedCount === 0) {
      return { message: 'No users found to delete' };
    }

    return {
      message: `Deleted ${result.deletedCount} users successfully`,
      deletedCount: result.deletedCount
    };
  }
}
