import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './auditlog.schema';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLog>,
  ) {}

  // Save a new Audit Log entry into MongoDB
  async createLog(data: {
    editedBy: string;
    userRole: string;
    module?: string;
    action?: string;
    targetEntity: string;
    details: string;
    reason: string;
    companyId?: string;
    branchId?: string;
    timestamp?: Date;
  }): Promise<AuditLog> {
    const log = new this.auditLogModel({
      editedBy: data.editedBy || 'Super Admin',
      userRole: data.userRole || 'Super Admin',
      module: data.module || 'Attendance',
      action: data.action || 'UPDATE',
      targetEntity: data.targetEntity,
      details: data.details,
      reason: data.reason,
      companyId: data.companyId,
      branchId: data.branchId,
      timestamp: data.timestamp || new Date(),
    });
    return log.save();
  }

  // Query Audit Logs with pagination, filters, and search
  async list(query: any): Promise<any> {
    const {
      page = 1,
      page_size = 10,
      search = '',
      from = '',
      to = '',
      module = '',
      action = '',
      companyId = '',
      branchId = '',
    } = query;

    const filter: any = {};
    if (companyId) filter.companyId = companyId;
    if (branchId) filter.branchId = branchId;
    if (module) filter.module = new RegExp(module, 'i');
    if (action) filter.action = action.toUpperCase();

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    if (search) {
      filter.$or = [
        { editedBy: new RegExp(search, 'i') },
        { userRole: new RegExp(search, 'i') },
        { targetEntity: new RegExp(search, 'i') },
        { details: new RegExp(search, 'i') },
        { reason: new RegExp(search, 'i') },
      ];
    }

    const skip = (page - 1) * page_size;
    const limit = parseInt(page_size, 10);

    const total = await this.auditLogModel.countDocuments(filter);
    const logs = await this.auditLogModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      data: logs,
      count: total,
      page: parseInt(page, 10),
      page_size: limit,
      total_pages: Math.ceil(total / limit) || 1,
    };
  }

  // Audit Log summary statistics
  async stats(query: any): Promise<any> {
    const totalLogs = await this.auditLogModel.countDocuments({});
    const attendanceEdits = await this.auditLogModel.countDocuments({ module: 'Attendance' });
    const uniqueEditors = (await this.auditLogModel.distinct('editedBy')).length;

    return {
      totalLogs,
      attendanceEdits,
      uniqueEditors,
    };
  }
}
