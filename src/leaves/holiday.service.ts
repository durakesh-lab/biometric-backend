import { InjectModel } from "@nestjs/mongoose";
import { Holiday } from "./holiday.schema";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Model } from "mongoose";

// holiday.service.ts
@Injectable()
export class HolidayService {
  constructor(@InjectModel(Holiday.name) private holidayModel: Model<Holiday>) {}

  async create(dto: any) {
    return this.holidayModel.create(dto);
  }

  async update(id: string, dto: any) {
    const updated = await this.holidayModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException('Holiday not found');
    return updated;
  }

  async findAll() {
    return this.holidayModel.find().populate('shift_group_id');
  }

  async findOne(id: string) {
    return this.holidayModel.findById(id).populate('shift_group_id');
  }
}
