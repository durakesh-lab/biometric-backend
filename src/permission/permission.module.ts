import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionsController } from './permission.controller';
import { PermissionsService } from './permission.service';
import { Permission, PermissionSchema } from './schemas/permission.schema';
import { SubPermission, SubPermissionSchema } from './schemas/sub-permission.schema';
import { RolePermission, RolePermissionSchema } from './schemas/role-permission';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Permission.name, schema: PermissionSchema },
      { name: SubPermission.name, schema: SubPermissionSchema },
      { name: RolePermission.name, schema: RolePermissionSchema }
    ]),
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}