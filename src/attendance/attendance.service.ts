import { BadRequestException, Injectable, Optional, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance } from './attendance.schema';
import { Employee } from '../employee/employee.schema';
import { Device } from '../device/device.schema';
import { AuditLogService } from '../auditlog/auditlog.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<Attendance>,
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(Device.name) private deviceModel: Model<Device>,
    @Optional() @Inject(AuditLogService) private auditLogService?: AuditLogService,
  ) { }

  // ── Sync punches from EasyWDMS for one device ─────────────────────────────
  private async syncOne(device: any): Promise<{ device: string; inserted: number; error?: string }> {
    if (!device.wdmsBaseUrl) return { device: device.name, inserted: 0, error: 'No EasyWDMS URL' };

    let inserted = 0;
    let page = 1;
    let hasMore = true;
    let consecutiveDups = 0;

    try {
      // Multi-page loop: Automatically fetches all un-synced pages in 1 click!
      while (hasMore) {
        const url = `${device.wdmsBaseUrl.replace(/\/$/, '')}/iclock/api/transactions/?page_size=1000&page=${page}&ordering=-punch_time`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(url, {
          headers: device.wdmsToken ? { Authorization: `Token ${device.wdmsToken}` } : {},
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (!res.ok) {
          console.error(`EasyWDMS API status ${res.status} for ${device.name}`);
          break;
        }

        const json: any = await res.json().catch(() => ({}));
        const punches: any[] = json?.data || json?.results || [];

        if (!punches || punches.length === 0) break;

        const newPunches: any[] = [];
        for (const p of punches) {
          const empCode = String(p.emp_code ?? p.pin ?? p.userId ?? '').trim();
          const punchTime = p.punch_time ?? p.punchTime ?? p.timestamp;
          if (!empCode || !punchTime) continue;

          // Terminal SN filter: Skip punches that belong to a different terminal
          const punchSn = String(p.terminal_sn ?? p.sn ?? p.device_sn ?? p.terminalSn ?? '').trim();
          if (device.serialNumber && punchSn && punchSn !== String(device.serialNumber).trim()) {
            continue;
          }

          const employee = await this.employeeModel.findOne({ deviceUserId: empCode });
          if (!employee) continue; // orphan punch — no enrolled employee

          const ts = new Date(punchTime);

          // Security Access Gateway: Block punches that occurred during ANY inactive window!
          const punchTimeMs = ts.getTime();
          let isPunchDuringInactivity = false;

          if (Array.isArray(employee.inactivityPeriods) && employee.inactivityPeriods.length > 0) {
            isPunchDuringInactivity = employee.inactivityPeriods.some((p: any) => {
              const fromMs = new Date(p.from).getTime();
              const toMs = p.to ? new Date(p.to).getTime() : Infinity;
              return punchTimeMs >= fromMs && punchTimeMs <= toMs;
            });
          } else if (employee.active_status === 'Inactive') {
            const inactTime = employee.inactivatedAt ? new Date(employee.inactivatedAt).getTime() : 0;
            if (inactTime > 0 && punchTimeMs >= inactTime) {
              isPunchDuringInactivity = true;
            } else if (!employee.inactivatedAt) {
              isPunchDuringInactivity = true;
            }
          }

          if (isPunchDuringInactivity) continue; // Block punch made during inactive period!

          // Option 1 Strict Device Access Control (deviceLinks):
          // If employee has specific authorized deviceLinks assigned, skip punches from unauthorized terminals!
          if (Array.isArray(employee.deviceLinks) && employee.deviceLinks.length > 0) {
            const isAuthorized = employee.deviceLinks.some((dl: any) => String(dl.deviceId) === String(device._id));
            if (!isAuthorized) continue; // Skip unauthorized device punch!
          }

          const dup = await this.attendanceModel.findOne({
            deviceUserId: empCode,
            timestamp: ts,
          });

          if (dup) {
            consecutiveDups++;
            if (consecutiveDups >= 5) {
              hasMore = false;
            }
          } else {
            const alreadyInBatch = newPunches.some(
              (np) => np.empCode === empCode && np.ts.getTime() === ts.getTime(),
            );
            if (!alreadyInBatch) {
              consecutiveDups = 0;
              newPunches.push({ p, employee, empCode, ts });
            }
          }
        }

        // Sort new punches chronologically (oldest first) so 1st punch of the day is processed first
        newPunches.sort((a, b) => a.ts.getTime() - b.ts.getTime());

        // Punch Type Mapping: 1st punch of day = 'in', subsequent = 'out'
        for (const item of newPunches) {
          const finalCheck = await this.attendanceModel.findOne({
            deviceUserId: item.empCode,
            timestamp: item.ts,
          });
          if (finalCheck) continue;

          const startOfDay = new Date(item.ts); startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(item.ts); endOfDay.setHours(23, 59, 59, 999);

          const existingToday = await this.attendanceModel.countDocuments({
            employeeId: String(item.employee._id),
            timestamp: { $gte: startOfDay, $lte: endOfDay },
          });

          const punchType = existingToday % 2 === 0 ? 'in' : 'out';

          await this.attendanceModel.create({
            employeeId: String(item.employee._id),
            deviceUserId: item.empCode,
            timestamp: item.ts,
            type: punchType,
            deviceId: String(device._id),
            companyId: item.employee.companyId,
            branchId: item.employee.branchId,
          });
          inserted++;
        }

        if (!hasMore) break;

        page++;
      }

      device.set('status', 'Online');
      device.set('lastSyncAt', new Date());
      await device.save();
      return { device: device.name, inserted };
    } catch (e: any) {
      device.set('status', 'Offline');
      await device.save();
      return { device: device.name, inserted, error: e.message };
    }
  }

  async sync(deviceId?: string): Promise<any> {
    const devices = deviceId
      ? [await this.deviceModel.findById(deviceId)]
      : await this.deviceModel.find({});
    const validDevices = devices.filter(Boolean);
    const results = await Promise.all(validDevices.map((d) => this.syncOne(d)));
    const total = results.reduce((n, r) => n + (r?.inserted || 0), 0);
    return { status: true, synced: total, devices: results };
  }

  // ── Manual Edit endpoint helper ────────────────────────────────────────
  async updatePunch(id: string, body: any, reqUser?: any): Promise<any> {
    const row = await this.attendanceModel.findById(id);
    if (!row) throw new BadRequestException('Attendance record not found');

    if (!body.editNote || typeof body.editNote !== 'string' || !body.editNote.trim()) {
      throw new BadRequestException('Edit reason / note is required for manual attendance correction');
    }

    if (body.type && ['in', 'out'].includes(body.type)) {
      row.type = body.type;
    }

    // Construct editorName dynamically from user profile (fullName / employeeCode / username / role)
    let editorName = reqUser?.role;
    if (reqUser) {
      const fullName = [reqUser.firstName, reqUser.lastName].filter(Boolean).join(' ').trim();
      const displayName = fullName || reqUser.username || reqUser.role;
      editorName = reqUser.employeeCode
        ? `${displayName} (Emp ID: ${reqUser.employeeCode})`
        : displayName;
    }

    row.editNote = body.editNote.trim();
    row.isManualEdit = true;
    row.editedBy = editorName;
    row.editedAt = new Date();
    await row.save();

    // Fetch employee for clear target entity labeling (HR employeeCode vs biometric deviceUserId)
    let empLabel = 'Attendance Record';
    if (row.employeeId) {
      const empObj = await this.employeeModel.findById(row.employeeId);
      if (empObj) {
        const fullName = `${empObj.firstName} ${empObj.lastName || ''}`.trim();
        if (empObj.employeeCode) {
          empLabel = `${fullName} (Emp ID: ${empObj.employeeCode})`;
        } else if (empObj.deviceUserId) {
          empLabel = `${fullName} (Device User ID: ${empObj.deviceUserId})`;
        } else {
          empLabel = fullName;
        }
      }
    }

    if (this.auditLogService) {
      await this.auditLogService.createLog({
        userRole: reqUser?.role,
        editedBy: editorName,
        module: 'Attendance',
        action: 'UPDATE',
        targetEntity: empLabel,
        details: `Manually corrected punch direction to ${row.type.toUpperCase()}`,
        reason: body.editNote.trim(),
        companyId: row.companyId,
        branchId: row.branchId,
        timestamp: new Date(),
      }).catch((err) => console.error('AuditLog error:', err.message));
    }

    return { status: true, data: row };
  }

  // ── List punches with employee + device names joined ──────────────────────
  async list(branchId: string, companyId: string, query: any): Promise<any> {
    const { page = 1, page_size = 20, from = '', to = '', employeeId = '', search = '' } = query;

    const filter: any = {};
    if (branchId) filter.branchId = branchId;
    if (companyId) filter.companyId = companyId;
    if (employeeId) filter.employeeId = employeeId;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    const skip = (page - 1) * page_size;
    const limit = parseInt(page_size);

    const pipeline: any[] = [
      { $match: filter },
      { $sort: { timestamp: -1 } },
      { $addFields: { empObjId: { $convert: { input: '$employeeId', to: 'objectId', onError: null, onNull: null } } } },
      { $lookup: { from: 'employees', localField: 'empObjId', foreignField: '_id', as: 'emp' } },
      { $unwind: { path: '$emp', preserveNullAndEmptyArrays: true } },
      { $addFields: { devObjId: { $convert: { input: '$deviceId', to: 'objectId', onError: null, onNull: null } } } },
      { $lookup: { from: 'devices', localField: 'devObjId', foreignField: '_id', as: 'dev' } },
      { $unwind: { path: '$dev', preserveNullAndEmptyArrays: true } },
      { $addFields: { branchObjId: { $convert: { input: '$branchId', to: 'objectId', onError: null, onNull: null } } } },
      { $lookup: { from: 'branches', localField: 'branchObjId', foreignField: '_id', as: 'br' } },
      { $unwind: { path: '$br', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1, timestamp: 1, deviceUserId: 1,
          type: { $ifNull: ['$type', 'in'] },
          editNote: 1, isManualEdit: 1, editedBy: 1, editedAt: 1,
          employeeName: { $trim: { input: { $concat: [{ $ifNull: ['$emp.firstName', ''] }, ' ', { $ifNull: ['$emp.lastName', ''] }] } } },
          deviceName: '$dev.name',
          branch_name: '$br.name',
        },
      },
    ];

    if (search) {
      pipeline.push({ $match: { employeeName: new RegExp(search, 'i') } });
    }

    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.attendanceModel.aggregate(countPipeline).exec();
    const total = countResult[0]?.total || 0;

    pipeline.push({ $skip: skip }, { $limit: limit });
    const data = await this.attendanceModel.aggregate(pipeline).exec();
    return { data, count: total, page: parseInt(page), page_size: limit, total_pages: Math.ceil(total / limit) };
  }

  // ── Simple stats for the top cards ────────────────────────────────────────
  async stats(branchId: string, companyId: string, query: any): Promise<any> {
    const day = query.date ? new Date(query.date) : new Date();
    const start = new Date(day); start.setHours(0, 0, 0, 0);
    const end = new Date(day); end.setHours(23, 59, 59, 999);

    const empFilter: any = {};
    if (branchId) empFilter.branchId = branchId;
    if (companyId) empFilter.companyId = companyId;
    const attFilter: any = { timestamp: { $gte: start, $lte: end } };
    if (branchId) attFilter.branchId = branchId;
    if (companyId) attFilter.companyId = companyId;

    const totalEmployees = await this.employeeModel.countDocuments(empFilter);
    const presentIds = await this.attendanceModel.distinct('employeeId', attFilter);
    const present = presentIds.length;
    const records = await this.attendanceModel.countDocuments(attFilter);

    return { present, absent: Math.max(totalEmployees - present, 0), totalEmployees, records };
  }
}
