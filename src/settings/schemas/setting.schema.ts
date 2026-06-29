import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Setting extends Document {
  @Prop({ required: true })
  type: string;

  // 2FA on/off toggle — the only thing an admin sets in the UI.
  @Prop({ required: true })
  datavalue: boolean;

  // Optional display-only sender label. NOT a credential.
  @Prop()
  email: string;

  // NOTE: SMTP credentials (sender + app password) are NO LONGER stored here.
  // They live server-side in .env (SMTP_USER / SMTP_PASS) — see auth.service.ts.
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
