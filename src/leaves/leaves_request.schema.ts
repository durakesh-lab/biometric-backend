import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class LeaveRequest extends Document {
  @Prop({ required: true })
  companyId: string;

  @Prop({ required: true })
  branchId: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  leave_type: string;

  @Prop({ required: true })
  startdate: Date;

  @Prop({ required: true })
  enddate: Date;

  @Prop({ type: Object, default: {} })
  leave_fullfil: Record<string, any>;

  @Prop({ type: [String], default: [] })
  team_email: string[];

  @Prop({ required: true })
  reason_for_leave: string;
}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);
