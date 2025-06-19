import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Permission } from './permission.schema';

@Schema({ timestamps: true })
export class SubPermission extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'Permission', required: true })
  parentPermission: Types.ObjectId | Permission;

  @Prop({ default: true })
  isActive: boolean;
}

export const SubPermissionSchema = SchemaFactory.createForClass(SubPermission);