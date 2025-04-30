// src/branch/branch.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Branch extends Document {
  @Prop({ required: true }) name: string;

  @Prop({ required: true }) manager: string;

  @Prop({ required: true }) address: string;

  @Prop({ required: true }) phoneNumber: string;

  @Prop({ required: true }) email: string;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: Array, default: [] })
  departments: any[];
}

export const BranchSchema = SchemaFactory.createForClass(Branch);
