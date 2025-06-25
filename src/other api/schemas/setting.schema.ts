import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Setting extends Document {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  datavalue: boolean;
   @Prop()
  email: string;

   @Prop()
  appPassword: string;

  
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
