// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document, Types } from 'mongoose';

// @Schema()
// export class Department extends Document {
//   @Prop({ required: true }) name: string;

//   @Prop({ required: true, type: Types.ObjectId, ref: 'Branch' }) branchId: Types.ObjectId;  // Reference to the branch

//   @Prop() otherDetails?: string;  // Optional additional field for the department
// }

// export const DepartmentSchema = SchemaFactory.createForClass(Department);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Department extends Document {
  @Prop({ required: true }) name: string;
  @Prop({ required: true, type: Types.ObjectId, ref: 'Branch' }) branchId: Types.ObjectId;  // Reference to the branch
  @Prop() otherDetails?: string;  // Optional field for additional details
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
