import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AuditLog extends Document {
  @Prop({ required: true }) editedBy: string;     // Name or username of user who performed action
  @Prop({ required: true }) userRole: string;     // Role of the user (e.g. "Super Admin", "HR Admin")
  @Prop({ required: true, default: 'Attendance' }) module: string; // Feature area (e.g. "Attendance")
  @Prop({ required: true, default: 'UPDATE' }) action: string;    // Action type (e.g. "UPDATE", "CREATE", "DELETE")
  @Prop({ required: true }) targetEntity: string; // Target record info (e.g. "John Smith (Emp ID: 4)")
  @Prop({ required: true }) details: string;      // Action details (e.g. "Manually corrected punch direction to OUT")
  @Prop({ required: true }) reason: string;       // Mandatory reason provided by user
  @Prop({ required: false }) companyId?: string;
  @Prop({ required: false }) branchId?: string;
  @Prop({ required: false, default: Date.now }) timestamp?: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ timestamp: -1 });
export type AuditLogDocument = AuditLog & Document;
