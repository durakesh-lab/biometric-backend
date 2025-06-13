// 1. groups.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Group extends Document {
  @Prop({ required: true })
  name: string;
 @Prop({ required: true })
  color: string;
   @Prop({ required: true})
  startTime: string;
     @Prop({ required: true })
  endTime: string;
   @Prop({ required: true })
  description: string;
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  members: Types.ObjectId[];
}

export const GroupSchema = SchemaFactory.createForClass(Group);
