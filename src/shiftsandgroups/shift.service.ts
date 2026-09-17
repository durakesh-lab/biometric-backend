import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Shift } from './shift.schema';
import { CreateShiftDto, UpdateShiftDto } from './dto/create-shift.dto';

@Injectable()
export class ShiftService {
  constructor(@InjectModel(Shift.name) private shiftModel: Model<Shift>) {}

  // Helper to generate next unique Shift Code per company e.g. "SHIFT-001"
  async generateNextShiftCode(companyId?: string): Promise<string> {
    const filter = companyId ? { companyId } : {};
    const shifts = await this.shiftModel.find(filter, { shiftCode: 1 }).exec();
    const numericCodes = shifts
      .map((s) => {
        const match = (s.shiftCode || '').match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : NaN;
      })
      .filter((num) => !isNaN(num));

    const maxCode = numericCodes.length > 0 ? Math.max(...numericCodes) : 0;
    const nextNum = (maxCode + 1).toString().padStart(3, '0');
    return `SHIFT-${nextNum}`;
  }

  async createShift(dto: CreateShiftDto): Promise<Shift> {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Shift Name is required');
    }
    if (!dto.companyId) {
      throw new BadRequestException('Company ID is required');
    }

    // Auto-generate shiftCode if omitted (scoped to company)
    if (!dto.shiftCode || !dto.shiftCode.trim()) {
      dto.shiftCode = await this.generateNextShiftCode(dto.companyId);
    }

    // Check duplicate shiftCode
    const existingCode = await this.shiftModel.findOne({
      shiftCode: dto.shiftCode.trim(),
      companyId: dto.companyId,
    });
    if (existingCode) {
      throw new BadRequestException(`Shift code "${dto.shiftCode}" already exists for this company`);
    }

    const shift = new this.shiftModel({
      ...dto,
      workingDays: dto.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      deviceIds: dto.deviceIds || [],
    });
    return shift.save();
  }

  async getAllShifts(query: any): Promise<Shift[]> {
    const filter: any = {};
    if (query.companyId) filter.companyId = query.companyId;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { shiftCode: { $regex: query.search, $options: 'i' } },
      ];
    }
    return this.shiftModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async getShiftById(id: string): Promise<Shift> {
    const shift = await this.shiftModel.findById(id).exec();
    if (!shift) {
      throw new NotFoundException(`Shift with ID "${id}" not found`);
    }
    return shift;
  }

  async updateShift(id: string, dto: UpdateShiftDto): Promise<Shift> {
    const existing = await this.shiftModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`Shift with ID "${id}" not found`);
    }

    if (dto.shiftCode && dto.shiftCode.trim() !== (existing.shiftCode || '').trim()) {
      const filter: any = {
        shiftCode: dto.shiftCode.trim(),
        companyId: dto.companyId || existing.companyId,
        _id: { $ne: existing._id },
      };
      const dup = await this.shiftModel.findOne(filter).exec();
      if (dup) {
        throw new BadRequestException(`Shift code "${dto.shiftCode}" already exists for this company`);
      }
    }

    existing.set(dto);
    return existing.save();
  }

  async deleteShift(id: string): Promise<{ message: string }> {
    const result = await this.shiftModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Shift with ID "${id}" not found`);
    }
    return { message: 'Shift deleted successfully' };
  }
}
