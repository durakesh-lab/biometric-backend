import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  createOrUpdate(@Body() dto: CreatePermissionDto) {
    return this.permissionService.createPermission(dto);
  }

  @Get(':role')
  getByRole(@Param('role') role: string) {
    return this.permissionService.getPermissionsByRole(role);
  }

  @Get()
  getAll() {
    return this.permissionService.getAllPermissions();
  }
}