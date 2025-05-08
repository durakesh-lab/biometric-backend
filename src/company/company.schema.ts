// company.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Company extends Document {
  @Prop({ required: true }) name: string;
  @Prop({ required: true,unique:true }) companyId: string;
  @Prop({ required: true }) owner: string;
  @Prop({ required: true }) mailingAddress: string;
  @Prop({ required: true }) email: string;
  @Prop({ required: true }) phoneNumber: string;
  @Prop() nominalCapital?: string;
  @Prop() industry?: string;
  @Prop() website?: string;
  @Prop() companyDescription?: string;
  @Prop({ type: Array, default: [] }) branches: any[];
}

export const CompanySchema = SchemaFactory.createForClass(Company);
