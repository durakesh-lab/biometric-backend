import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// One row per punch pulled from the device (via EasyWDMS), resolved to an employee.
@Schema({ timestamps: true })
export class Attendance extends Document {
  @Prop({ required: true }) employeeId: string;   // our employees._id
  @Prop({ required: true }) deviceUserId: string; // the device emp_code that matched
  @Prop({ required: true }) timestamp: Date;
  @Prop({ enum: ['in', 'out'], default: 'in' }) type: string;
  @Prop({ required: false }) deviceId: string;    // our devices._id (source)
  @Prop({ required: false }) companyId: string;
  @Prop({ required: false }) branchId: string;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
// Prevent duplicate rows for the same punch on re-sync.
AttendanceSchema.index({ deviceUserId: 1, timestamp: 1, deviceId: 1 }, { unique: false });
export type AttendanceDocument = Attendance & Document;
