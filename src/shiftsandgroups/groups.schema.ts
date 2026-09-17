import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Group extends Document {
  @Prop({ required: true, trim: true })
  name: string; // Group Name (e.g., "Field Technicians Taskforce", "Executive Management Team")

  @Prop({ required: false, trim: true, default: '' })
  groupCode: string; // Group Code (e.g., "GRP-001", "GRP-TECH-01")

  @Prop({ required: true })
  companyId: string; // Active Working Organization Context

  @Prop({ type: [String], default: [] })
  assignedShiftIds: string[]; // Assigned 24h Shift IDs (Primary Shift + optional Secondary/Split Shift)

  @Prop({ required: false, trim: true, default: '' })
  description?: string; // Optional notes / description for the shift group

  @Prop({ type: [String], default: [] })
  memberEmpCodes: string[]; // Enrolled Group Staff (Array of Employee Device User IDs / Code identifiers)
}

export const GroupSchema = SchemaFactory.createForClass(Group);
export type GroupDocument = Group & Document;
