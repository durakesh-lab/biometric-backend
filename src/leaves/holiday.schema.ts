// holiday.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Holiday extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  classification: string;

@Prop({ type: Types.ObjectId, ref: 'Group', required: false })
shift_group_id: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop()
  description: string;

  @Prop()
  notify: boolean;

  @Prop()
  reprocess: boolean;
}

export const HolidaySchema = SchemaFactory.createForClass(Holiday);
