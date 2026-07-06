import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance } from './attendance.schema';
import { Employee } from '../employee/employee.schema';
import { Device } from '../device/device.schema';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<Attendance>,
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(Device.name) private deviceModel: Model<Device>,
  ) {}

  // ── Sync punches from EasyWDMS for one device ─────────────────────────────
  private async syncOne(device: any): Promise<{ device: string; inserted: number; error?: string }> {
    if (!device.wdmsBaseUrl) return { device: device.name, inserted: 0, error: 'No EasyWDMS URL' };
    const url = `${device.wdmsBaseUrl.replace(/\/$/, '')}/iclock/api/transactions/?page_size=1000`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let inserted = 0;
    try {
      const res = await fetch(url, {
        headers: device.wdmsToken ? { Authorization: `Token ${device.wdmsToken}` } : {},
        signal: controller.signal,
      });
      clearTimeout(timer);
      const json: any = await res.json().catch(() => ({}));
      const punches: any[] = json?.data || json?.results || [];

      for (const p of punches) {
        const empCode = String(p.emp_code ?? p.pin ?? p.userId ?? '').trim();
        const punchTime = p.punch_time ?? p.punchTime ?? p.timestamp;
        if (!empCode || !punchTime) continue;

        const employee = await this.employeeModel.findOne({ deviceUserId: empCode });
        if (!employee) continue; // orphan punch — no enrolled employee

        const ts = new Date(punchTime);
        const dup = await this.attendanceModel.findOne({
          deviceUserId: empCode,
          timestamp: ts,
          deviceId: String(device._id),
        });
        if (dup) continue;

        await this.attendanceModel.create({
          employeeId: String(employee._id),
          deviceUserId: empCode,
          timestamp: ts,
          type: Number(p.punch_state ?? p.state ?? 0) === 1 ? 'out' : 'in',
          deviceId: String(device._id),
          companyId: employee.companyId,
          branchId: employee.branchId,
        });
        inserted++;
      }

      device.set('status', 'Online');
      device.set('lastSyncAt', new Date());
      await device.save();
      return { device: device.name, inserted };
    } catch (e: any) {
      clearTimeout(timer);
      device.set('status', 'Offline');
      await device.save();
      return { device: device.name, inserted, error: e.message };
    }
  }

  async sync(deviceId?: string): Promise<any> {
    const devices = deviceId
      ? [await this.deviceModel.findById(deviceId)]
      : await this.deviceModel.find({});
    const results: any[] = [];
    for (const d of devices) {
      if (d) results.push(await this.syncOne(d));
    }
    const total = results.reduce((n, r) => n + (r.inserted || 0), 0);
    return { status: true, synced: total, devices: results };
  }

  // ── Demo helper: inject a punch without hardware ──────────────────────────
  async addTestPunch(body: any): Promise<any> {
    const employee = await this.employeeModel.findById(body.employeeId);
    if (!employee) throw new BadRequestException('Employee not found');
    if (!employee.deviceUserId) {
      throw new BadRequestException('Employee is not enrolled (no Device User ID) — link one in Enrollment first');
    }
    const row = await this.attendanceModel.create({
      employeeId: String(employee._id),
      deviceUserId: employee.deviceUserId,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      type: body.type === 'out' ? 'out' : 'in',
      deviceId: body.deviceId || '',
      companyId: employee.companyId,
      branchId: employee.branchId,
    });
    return { status: true, data: row };
  }

  // ── List punches with employee + device names joined ──────────────────────
  async list(branchId: string, query: any): Promise<any> {
    const { page = 1, page_size = 20, from = '', to = '', employeeId = '', search = '' } = query;

    const filter: any = {};
    if (branchId) filter.branchId = branchId;
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
          _id: 1, timestamp: 1, type: 1, deviceUserId: 1,
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
  async stats(branchId: string, query: any): Promise<any> {
    const day = query.date ? new Date(query.date) : new Date();
    const start = new Date(day); start.setHours(0, 0, 0, 0);
    const end = new Date(day); end.setHours(23, 59, 59, 999);

    const empFilter: any = {};
    if (branchId) empFilter.branchId = branchId;
    const attFilter: any = { timestamp: { $gte: start, $lte: end } };
    if (branchId) attFilter.branchId = branchId;

    const totalEmployees = await this.employeeModel.countDocuments(empFilter);
    const presentIds = await this.attendanceModel.distinct('employeeId', attFilter);
    const present = presentIds.length;
    const records = await this.attendanceModel.countDocuments(attFilter);

    return { present, absent: Math.max(totalEmployees - present, 0), totalEmployees, records };
  }
}
