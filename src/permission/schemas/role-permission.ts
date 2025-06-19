import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class RolePermission extends Document {
  @Prop({ required: true, unique: true })
  role: string;

  @Prop()
  permAndSubPerm: string;

}

export const RolePermissionSchema = SchemaFactory.createForClass(RolePermission);