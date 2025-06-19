import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission } from './schemas/permission.schema';
import { SubPermission } from './schemas/sub-permission.schema';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { CreateSubPermissionDto } from './dtos/create-sub-permission.dto';
import { RolePermission } from './schemas/role-permission';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name) private permissionModel: Model<Permission>,
    @InjectModel(SubPermission.name) private subPermissionModel: Model<SubPermission>,
    @InjectModel(RolePermission.name) private RolePermissionModel: Model<RolePermission>,
  ) {}

  async createPermission(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const createdPermission = new this.permissionModel(createPermissionDto);
    return createdPermission.save();
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionModel.find().populate('subPermissions').exec();
  }
    async findpermissionsbyrole(role): Promise<any[]> {
    return this.RolePermissionModel.find({role:role});
  }
      async createpermissionsbyrole(body): Promise<any> {
      const existing = await this.RolePermissionModel.findOne({ role: body.role });

  const permAndSubPerm = JSON.stringify({
    permission: body.permission,
    sub_permission: body.sub_permission,
  });

  if (existing) {
    return this.RolePermissionModel.updateOne(
      { role: body.role },
      { $set: { permAndSubPerm } }
    );
        }  
        else{
  let createrolepermission=new this.RolePermissionModel({role:body.role,permAndSubPerm:JSON.stringify({permission:body.permission,sub_permission:body.sub_permission}) })
    return createrolepermission.save()
        }
      
  }

  async createSubPermission(createSubPermissionDto: CreateSubPermissionDto): Promise<SubPermission> {
    const createdSubPermission = new this.subPermissionModel(createSubPermissionDto);
    const savedSubPermission = await createdSubPermission.save();
    
    // Add sub-permission to parent permission
    await this.permissionModel.findByIdAndUpdate(
      createSubPermissionDto.parentPermission,
      { $push: { subPermissions: savedSubPermission._id } },
    );

    return savedSubPermission;
  }

  async findAllSubPermissions(): Promise<SubPermission[]> {
    return this.subPermissionModel.find().populate('parentPermission').exec();
  }
}