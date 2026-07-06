import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// A physical biometric device (ZKTeco F09/K45) and how to reach its EasyWDMS.
@Schema({ timestamps: true })
export class Device extends Document {
  @Prop({ required: true }) name: string;

  @Prop({ required: true }) serialNumber: string;

  // EasyWDMS connection
  @Prop({ required: false }) wdmsBaseUrl: string;   // e.g. http://192.168.0.104:8081
  @Prop({ required: false }) wdmsToken: string;     // API token from /api-token-auth/
  @Prop({ required: false }) terminalId: string;    // terminal/serial id inside EasyWDMS

  @Prop({ required: true }) companyId: string;
  @Prop({ required: true }) branchId: string;

  @Prop({ enum: ['Online', 'Offline'], default: 'Offline' }) status: string;

  @Prop({ required: false }) lastSyncAt: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
export type DeviceDocument = Device & Document;
