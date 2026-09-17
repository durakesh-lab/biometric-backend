import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Shift extends Document {
  @Prop({ required: true, trim: true })
  name: string; // Shift Name (e.g., "Evening Shift (Floor 1 Entrance)")

  @Prop({ required: false, trim: true, default: '' })
  shiftCode: string; // Shift Code (e.g., "SHIFT-MORN-01")

  @Prop({ required: true })
  startTime: string; // Start Time (24h Format HH:mm e.g. "17:00")

  @Prop({ required: true })
  endTime: string; // End Time (24h Format HH:mm e.g. "21:00")

  @Prop({
    type: [String],
    enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  })
  workingDays: string[]; // Select Working Days (Mon - Sun)

  @Prop({ type: [String], default: [] })
  deviceIds: string[]; // Allowed Attendance Biometric Devices (Location Restriction)

  @Prop({ required: false, trim: true, default: '' })
  description?: string; // Optional comments/notes for the shift

  @Prop({ required: true })
  companyId: string; // Active Working Organization Context
}

export const ShiftSchema = SchemaFactory.createForClass(Shift);
