import { Controller, Get, Post, Body, UsePipes, ValidationPipe, Param, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateSubPermissionDto } from './dto/create-sub-permission.dto';
import { Permission } from './schemas/permission.schema';
import { SubPermission } from './schemas/sub-permission.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async createPermission(@Body() createPermissionDto: CreatePermissionDto): Promise<Permission> {
    return this.permissionsService.createPermission(createPermissionDto);
  }

  @Get()
  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionsService.findAllPermissions();
  }
    @Get("findpermissionsbyrole/:role")
  async findAllPermissionsbyrole(@Param('role') role:string): Promise<any[]> {
    return this.permissionsService.findpermissionsbyrole(role);
  }

      @Post("createpermissionsbyrole")
  async createPermissionsbyrole(@Body() body:any): Promise<any[]> {
    return this.permissionsService.createpermissionsbyrole(body);
  }

  @Post('sub')
  @UsePipes(new ValidationPipe())
  async createSubPermission(@Body() createSubPermissionDto: CreateSubPermissionDto): Promise<SubPermission> {
    return this.permissionsService.createSubPermission(createSubPermissionDto);
  }

  @Get('sub')
  async findAllSubPermissions(): Promise<SubPermission[]> {
    return this.permissionsService.findAllSubPermissions();
  }
}