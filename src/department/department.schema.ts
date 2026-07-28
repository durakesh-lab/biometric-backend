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
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Department extends Document {
  @Prop({ required: true }) name: string;

  @Prop({ required: true }) dept_code: string;

  @Prop({ required: true }) branchId: string;

  @Prop({ required: false }) company_id: string;
  @Prop({ required: false }) otherDetails: string;

  

}

// export const DepartmentSchema = SchemaFactory.createForClass(Department);
//   @Prop({ required: true, type: Types.ObjectId, ref: 'Branch' }) branchId: Types.ObjectId;  // Reference to the branch
//   @Prop() otherDetails?: string;  // Optional field for additional details
// }

export const DepartmentSchema = SchemaFactory.createForClass(Department);
