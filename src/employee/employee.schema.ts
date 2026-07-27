import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class DeviceLink {
  @Prop({ required: true })
  deviceId: string;

  // Schedule rules reserved for future requirements:
  // @Prop({ type: [Number], default: [] }) allowedDays?: number[];
  // @Prop({ required: false }) startTime?: string;
  // @Prop({ required: false }) endTime?: string;
}

export const DeviceLinkSchema = SchemaFactory.createForClass(DeviceLink);

// An Employee is a person whose ATTENDANCE is tracked.
// It is NOT a system user: there is no username / password / role here.
// (System logins live in the separate `users` collection.)
@Schema({ timestamps: true })
export class Employee extends Document {
  @Prop({ required: true }) firstName: string;

  @Prop({ required: false }) lastName: string;

  @Prop({ required: false, sparse: true, default: null }) email: string;

  @Prop({ required: false }) mobile: number;

  @Prop({ required: false }) gender: string;

  @Prop({ required: true }) companyId: string;

  @Prop({ required: true }) branchId: string;

  @Prop({ required: false }) deptId: string;

  // human/HR identifier (optional)
  @Prop({ required: false, sparse: true, default: null }) employeeCode: string;

  // Bridge to the biometric hardware. Blank until the person is enrolled on the device.
  @Prop({ required: false, default: '' }) deviceUserId: string;

  @Prop({ type: [DeviceLinkSchema], default: [] }) deviceLinks: DeviceLink[];

  @Prop({ enum: ['Active', 'Inactive'], default: 'Active' }) active_status: string;

  @Prop({ required: false }) joining_date: string;

  @Prop({ required: false }) date_of_birth: string;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
export type EmployeeDocument = Employee & Document;
