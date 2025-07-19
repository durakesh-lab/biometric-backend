import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Leaves extends Document {
  @Prop({ required: true })
  companyId: string;

  @Prop({ required: true })
  branchId: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  year: number;

  @Prop({ type: Object, default: {} })
  casual_leaves: Record<string, any>;

  @Prop({ type: Object, default: {} })
  sick_leaves: Record<string, any>;

  @Prop({ type: Object, default: {} })
  leaves_without_pay: Record<string, any>;
}

export const LeavesSchema = SchemaFactory.createForClass(Leaves);
