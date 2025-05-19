import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission } from './permissions.schema';
import { CreatePermissionDto } from './dto/create-permission.dto';

@Injectable()
export class PermissionService {
  constructor(@InjectModel(Permission.name) private permModel: Model<Permission>) {}

  async createPermission(dto: CreatePermissionDto) {
    const exists = await this.permModel.findOne({ role: dto.role });
    if (exists) {
      exists.permissions = dto.permissions;
      return exists.save();
    }
    return new this.permModel(dto).save();
  }

  async getPermissionsByRole(role: string) {
    const perm = await this.permModel.findOne({ role });
    if (!perm) throw new NotFoundException('Permission role not found');
    return perm;
  }

  async getAllPermissions() {
    return this.permModel.find();
  }
}