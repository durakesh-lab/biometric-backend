
// 3. group.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group } from './groups.schema';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupService {
  constructor(@InjectModel(Group.name) private groupModel: Model<Group>) {}

  async createGroup(dto: CreateGroupDto) {
    return new this.groupModel(dto).save();
  }

  async addMembers(groupId: string, memberIds: string[]) {
    const group = await this.groupModel.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    const newMembers = memberIds.map((id) => new Types.ObjectId(id));
    group.members.push(...newMembers);
    return group.save();
  }

  async getGroupWithMembers(groupId: string) {
    return this.groupModel.findById(groupId).populate('members');
  }

  async getAllGroups() {
    return this.groupModel.find().populate('members');
  }
}