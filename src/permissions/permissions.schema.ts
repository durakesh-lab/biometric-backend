// 1. permissions.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Permission extends Document {
  @Prop({ required: true, unique: true })
  role: string;

  @Prop({ type: [String], default: [] })
  permissions: string[]; // List of allowed actions or modules
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);