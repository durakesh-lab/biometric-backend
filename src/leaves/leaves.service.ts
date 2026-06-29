import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Leaves } from './leaves.schema';
import { LeaveRequest } from './leaves-request.schema';
import { Branch } from 'src/branch/branch.schema';
import { UserDocument } from 'src/user/user.schema';
import { Company } from 'src/company/company.schema';
import { Group } from 'src/groups/groups.schema';

@Injectable()
export class LeavesService {
  constructor(@InjectModel(Group.name) private groupModel: Model<Group>,@InjectConnection() private readonly connection: Connection,@InjectModel(Leaves.name) private leavesModel: Model<Leaves>,@InjectModel(LeaveRequest.name) private leavesrequestModel: Model<LeaveRequest>,  @InjectModel(Company.name) private companyModel: Model<Company>,
    @InjectModel(Branch.name) private branchModel: Model<Branch>,
   @InjectModel('User') private userModel: Model<UserDocument>,) {}

  async myLeaves(body): Promise<any> {
    let leavedata=await this.leavesModel.findOne({companyId:body.companyId,branchId:body.branchId,username:body.username})

    if(leavedata){
        return leavedata
    }
    else{

  const settingsCollection = this.connection.collection('settings');
  const settings: any = await settingsCollection.findOne({ type: "leaves" });

    return settings;
    }

  }
   
  async applyleave(body: any): Promise<any> {
    const { companyId, branchId, username, startdate, enddate, ...otherBody } = body;

    // 1. Validate required fields from schema
    const requiredFields = [
      'companyId',
      'branchId',
      'username',
      'leave_type',
      'startdate',
      'enddate',
      'reason_for_leave',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        throw new BadRequestException(`Missing required field: ${field}`);
      }
    }

    // 2. Check if company exists
    const company = await this.companyModel.findById(companyId).exec();
    if (!company) {
      throw new NotFoundException(`Company with ID "${companyId}" not found.`);
    }

    // 3. Check if branch exists within the company
    const branch = await this.branchModel.findOne({ _id: branchId, companyId: companyId }).exec();
    if (!branch) {
      throw new NotFoundException(`Branch with ID "${branchId}" not found for company ID "${companyId}".`);
    }

    // 4. Check if username exists in users collection
    const user = await this.userModel.findOne({ username: username, companyId: companyId, branchId: branchId }).exec();
    if (!user) {
      throw new NotFoundException(`User with username "${username}" not found for the specified company and branch.`);
    }

    // 5. Calculate total_duration_of_leave
    const startDate = new Date(startdate);
    const endDate = new Date(enddate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid startdate or enddate format. Please use a valid date string.');
    }

    if (startDate > endDate) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const total_duration_of_leave = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Duration in days

    // 6. Set leave_request_date
    const leave_request_date = new Date(); // Current date and time

    // 7. Prepare data for storage, including only required fields and calculated ones
    const leaveData = {
      companyId: body.companyId,
      branchId: body.branchId,
      username: body.username,
      leave_type: body.leave_type,
      startdate: startDate,
      enddate: endDate,
      leave_request_date: leave_request_date,
      total_duration_of_leave: total_duration_of_leave,
      reason_for_leave: body.reason_for_leave,
      // Optional fields with defaults or if provided in body
      leave_fullfil: body.leave_fullfil || {},
      team_email: body.team_email || [],
      leave_status: body.leave_status || 'Pending', // Default status
      leave_approved_by: body.leave_approved_by || { by_manager: false, by_hrmanager: false },
    };

    // 8. Store the data in leaverequests collection
    const createdLeaveRequest = new this.leavesrequestModel(leaveData);
    const result = await createdLeaveRequest.save();

    return { message: 'Leave request submitted successfully', data: result };
  }

async getMyLeaves(
  body: { companyId: string; branchId: string; username: string },
  query: {
    leave_type?: string;
    startdate?: string;
    enddate?: string;
    leave_request_date?: string;
    leave_status?: string;
    leave_time?: 'past' | 'upcoming' | '';
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  },
): Promise<any> {
  const { companyId, branchId, username } = body;
  const {
    leave_type,
    startdate,
    enddate,
    leave_request_date,
    leave_status,
    leave_time,
    order = 'desc',
    page = 1,
    limit = 10,
  } = query;

  // Validate required body fields
  if (!companyId || !branchId || !username) {
    throw new BadRequestException('companyId, branchId, and username are required in the request body.');
  }

  // Build query for leave requests
  const leaveQuery: any = { companyId, branchId, username };

  if (leave_type) {
    leaveQuery.leave_type = leave_type;
  }
  if (leave_status) {
    leaveQuery.leave_status = leave_status;
  }

  // Date range filters
  const currentDate = new Date();
  if (startdate) {
    const startDateObj = new Date(startdate);
    if (isNaN(startDateObj.getTime())) {
      throw new BadRequestException('Invalid startdate query parameter.');
    }
    leaveQuery.startdate = { $gte: startDateObj };
    
    // Handle leave_time filter
    if (leave_time === 'past') {
      leaveQuery.startdate = { $lt: startDateObj };
    } else if (leave_time === 'upcoming') {
      leaveQuery.startdate = { $gte: startDateObj };
    }
  } else if (leave_time) {
    // If no startdate provided but leave_time is specified
    if (leave_time === 'past') {
      leaveQuery.startdate = { $lt: currentDate };
    } else if (leave_time === 'upcoming') {
      leaveQuery.startdate = { $gte: currentDate };
    }
  }

  if (enddate) {
    const endDateObj = new Date(enddate);
    if (isNaN(endDateObj.getTime())) {
      throw new BadRequestException('Invalid enddate query parameter.');
    }
    leaveQuery.enddate = { $lte: endDateObj };
  }
  
  if (leave_request_date) {
    const requestDateObj = new Date(leave_request_date);
    if (isNaN(requestDateObj.getTime())) {
      throw new BadRequestException('Invalid leave_request_date query parameter.');
    }
    // For exact date match, consider a range for the day
    const nextDay = new Date(requestDateObj);
    nextDay.setDate(requestDateObj.getDate() + 1);
    leaveQuery.leave_request_date = { $gte: requestDateObj, $lt: nextDay };
  }

  const skip = (page - 1) * limit;

  // Determine sort order - using leave_request_date since createdAt doesn't exist
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortCriteria:any = { leave_request_date: sortOrder };

  // Fetch leave requests
  const [leaves, totalLeaves] = await Promise.all([
    this.leavesrequestModel
      .find(leaveQuery)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .exec(),
    this.leavesrequestModel.countDocuments(leaveQuery).exec(),
  ]);

  // Manually join with user data
  const uniqueUsernames = [...new Set(leaves.map((leave) => leave.username))];
  const users = await this.userModel.find({ username: { $in: uniqueUsernames } }).exec();
  const userMap = new Map(users.map((user) => [user.username, user.toObject()]));

  const leavesWithUserData = leaves.map((leave) => {
    const leaveObject = leave.toObject();
    return {
      ...leaveObject,
      user_data: userMap.get(leave.username) || null,
    };
  });

  return {
    page: +page,
    limit: +limit,
    total_items: totalLeaves,
    total_pages: Math.ceil(totalLeaves / limit),
    data: leavesWithUserData,
  };
}
async getAllLeaves(
  body: { companyId: string; branchId: string },
  query: {
    search?: string;
    page?: number;
    limit?: number;
    leave_type?: string;
    leave_status?: string;
    startdate?: string;
    enddate?: string;
    leave_request_date?: string;
    order?: 'asc' | 'desc'; // New order parameter
  },
): Promise<any> {
  const { companyId, branchId } = body;
  const {
    search,
    page = 1,
    limit = 10,
    leave_type,
    leave_status,
    startdate,
    enddate,
    leave_request_date,
    order = 'desc', // Default to descending (newest first)
  } = query;

  // Validate required body fields
  if (!companyId || !branchId) {
    throw new BadRequestException('companyId and branchId are required in the request body.');
  }

  const skip = (page - 1) * limit;

  let userFilter: any = { companyId, branchId };
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    userFilter.$or = [
      { username: searchRegex },
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { role: searchRegex },
    ];
  }

  // First, find users based on search criteria AND company/branch
  const matchingUsers = await this.userModel.find(userFilter, { username: 1 }).exec();
  const matchingUsernames = matchingUsers.map((user) => user.username);

  // If no users match the search/company/branch, return empty results
  if ((search || companyId || branchId) && matchingUsernames.length === 0) {
    return {
      page: +page,
      limit: +limit,
      total_items: 0,
      total_pages: 0,
      data: [],
    };
  }

  // Build query for leave requests
  const leaveQuery: any = { companyId, branchId };

  // If there's a search, filter leave requests by the matching usernames
  if (search) {
    leaveQuery.username = { $in: matchingUsernames };
  }

  // Apply additional filters for all leaves
  if (leave_type) {
    leaveQuery.leave_type = leave_type;
  }
  if (leave_status) {
    leaveQuery.leave_status = leave_status;
  }
  if (startdate) {
    const startDateObj = new Date(startdate);
    if (isNaN(startDateObj.getTime())) {
      throw new BadRequestException('Invalid startdate query parameter.');
    }
    leaveQuery.startdate = { $gte: startDateObj };
  }
  if (enddate) {
    const endDateObj = new Date(enddate);
    if (isNaN(endDateObj.getTime())) {
      throw new BadRequestException('Invalid enddate query parameter.');
    }
    leaveQuery.enddate = { $lte: endDateObj };
  }
  if (leave_request_date) {
    const requestDateObj = new Date(leave_request_date);
    if (isNaN(requestDateObj.getTime())) {
      throw new BadRequestException('Invalid leave_request_date query parameter.');
    }
    const nextDay = new Date(requestDateObj);
    nextDay.setDate(requestDateObj.getDate() + 1);
    leaveQuery.leave_request_date = { $gte: requestDateObj, $lt: nextDay };
  }

  // Determine sort order - using leave_request_date
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortCriteria:any = { leave_request_date: sortOrder };

  // Fetch leave requests with sorting
  const [leaves, totalLeaves] = await Promise.all([
    this.leavesrequestModel
      .find(leaveQuery)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .exec(),
    this.leavesrequestModel.countDocuments(leaveQuery).exec(),
  ]);

  // Manually join with user data for all retrieved leaves
  const uniqueUsernamesInLeaves = [...new Set(leaves.map((leave) => leave.username))];
  const users = await this.userModel.find({ username: { $in: uniqueUsernamesInLeaves } }).exec();
  const userMap = new Map(users.map((user) => [user.username, user.toObject()]));

  const leavesWithUserData = leaves.map((leave) => {
    const leaveObject = leave.toObject();
    return {
      ...leaveObject,
      user_data: userMap.get(leave.username) || null,
    };
  });

  return {
    page: +page,
    limit: +limit,
    total_items: totalLeaves,
    total_pages: Math.ceil(totalLeaves / limit),
    data: leavesWithUserData,
  };
}

  async updateLeaveStatus(
    leave_id: string,
    approved_by: 'manager' | 'hr-manager',
    decision: 'accept' | 'reject',
  ): Promise<any> {
    // 1. Validate inputs
    if (!leave_id) {
      throw new BadRequestException('leave_id is required.');
    }
    if (!['manager', 'hr-manager'].includes(approved_by)) {
      throw new BadRequestException('approved_by must be "manager" or "hr-manager".');
    }
    if (!['accept', 'reject'].includes(decision)) {
      throw new BadRequestException('decision must be "accept" or "reject".');
    }

    // 2. Find the leave request
    const leaveRequest = await this.leavesrequestModel.findById(leave_id).exec();
    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID "${leave_id}" not found.`);
    }

    // 3. Apply logic based on decision
    if (decision === 'accept') {
      if (approved_by === 'manager') {
        leaveRequest.leave_approved_by.by_manager = true;
      } else if (approved_by === 'hr-manager') {
        leaveRequest.leave_approved_by.by_hrmanager = true;
      }
      // Mark the nested object as modified
      leaveRequest.markModified('leave_approved_by');

      // If both manager and HR manager have approved, set status to 'accepted'
      if (leaveRequest.leave_approved_by.by_manager && leaveRequest.leave_approved_by.by_hrmanager) {
        leaveRequest.leave_status = 'Accepted';
      } else if (leaveRequest.leave_status !== 'Rejected') {
        // Keep status as pending if not fully accepted and not previously rejected
        leaveRequest.leave_status = 'Pending';
      }
    } else if (decision === 'reject') {
      // If rejected by either, set status to 'Rejected'
      leaveRequest.leave_status = 'Rejected';
      // No need to markModified for leave_status as it's a direct field
    }

    // 4. Save the updated leave request
    const updatedLeaveRequest = await leaveRequest.save();

    return { message: 'Leave request status updated successfully', data: updatedLeaveRequest };
  }

  async addShift(dto:any) {
    const group:any = await this.groupModel.findById(dto.group_id);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    group.shifts={
      shift_name: dto.shift_name,
      start_time: dto.start_time,
      end_time: dto.end_time,
    };

    return group.save();
  }
   async getMyShift(dto: any) {
  const user:any = await this.userModel.findById(dto.user_id);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  const group = await this.groupModel.findById(user.groupId);

  if (!group) {
    throw new NotFoundException('Group not found for this user');
  }

  return {
    shift: group.shifts,
    shiftTimeWindow: {
      groupStartTime: group.startTime,
      groupEndTime: group.endTime,
    },
    groupName: group.name,
  };
}

}
