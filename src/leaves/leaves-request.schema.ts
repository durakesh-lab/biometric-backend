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

    @Prop({ required: true })
  leave_request_date: Date;
     @Prop({ required: true })
  total_duration_of_leave: number; // Changed to number as it represents days

  @Prop({ type: Object, default: {} })
  leave_fullfil: Record<string, any>;

  @Prop({ type: [String], default: [] })
  team_email: string[];

  @Prop({ required: true })
  reason_for_leave: string;

  @Prop({ default: 'Pending' }) // Added a default value for leave_status
  leave_status: string;

  @Prop({
  type: Object,
  default: {
    by_manager: false,
    by_hrmanager: false,
  },
})
leave_approved_by: {
  by_manager: boolean;
  by_hrmanager: boolean;
  [key: string]: any; // ✅ allows dynamic additional keys
};

}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);
