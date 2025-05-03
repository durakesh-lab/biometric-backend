import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Department extends Document {
  @Prop({ required: true }) name: string;

  @Prop({ required: true }) dept_code: string;

  @Prop({ required: true }) branchId: string;

  @Prop({ required: false }) company_id: string;
  @Prop({ required: false }) otherDetails: string;

  

}

export const DepartmentSchema = SchemaFactory.createForClass(Department);