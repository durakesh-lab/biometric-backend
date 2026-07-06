import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Device } from './device.schema';

const ALLOWED_FIELDS = [
  'name',
  'serialNumber',
  'wdmsBaseUrl',
  'wdmsToken',
  'terminalId',
  'companyId',
  'branchId',
  'status',
];

@Injectable()
export class DeviceService {
  constructor(@InjectModel(Device.name) private deviceModel: Model<Device>) {}

  private pick(body: any): Partial<Device> {
    const out: any = {};
    for (const f of ALLOWED_FIELDS) {
      if (body[f] !== undefined && body[f] !== '') out[f] = body[f];
    }
    if (body.branch !== undefined && body.branch !== '') out.branchId = body.branch;
    return out;
  }

  async createDevice(body: any): Promise<Device> {
    const payload = this.pick(body);
    if (!payload.name || !payload.serialNumber) {
      throw new BadRequestException('Name and serial number are required');
    }
    if (!payload.companyId || !payload.branchId) {
      throw new BadRequestException('Company and branch are required');
    }
    return new this.deviceModel(payload).save();
  }

  async updateDevice(id: string, body: any): Promise<any> {
    const existing = await this.deviceModel.findById(id);
    if (!existing) throw new BadRequestException('Device not found');
    existing.set(this.pick(body));
    return existing.save();
  }

  async deleteDevice(id: string): Promise<{ message: string }> {
    const result = await this.deviceModel.findByIdAndDelete(id);
    return { message: result ? 'Device deleted successfully' : 'Device not found' };
  }

  // Paginated list with branch/company names joined in.
  async getAllDevices(branchId: string, companyId: string, query: any): Promise<any> {
    const { page = 1, page_size = 10, search = '', ordering = '' } = query;

    const filter: any = {};
    if (branchId) filter.branchId = branchId;
    if (companyId) filter.companyId = companyId;
    if (search) {
      const rx = new RegExp(search, 'i');
      filter.$or = [{ name: rx }, { serialNumber: rx }];
    }

    const sort: any = {};
    if (ordering) {
      const dir = ordering.startsWith('-') ? -1 : 1;
      sort[ordering.startsWith('-') ? ordering.substring(1) : ordering] = dir;
    }

    const skip = (page - 1) * page_size;
    const limit = parseInt(page_size);

    const pipeline: any[] = [
      { $match: filter },
      {
        $addFields: {
          branchIdObj: { $convert: { input: '$branchId', to: 'objectId', onError: null, onNull: null } },
          companyIdObj: { $convert: { input: '$companyId', to: 'objectId', onError: null, onNull: null } },
        },
      },
      { $lookup: { from: 'branches', localField: 'branchIdObj', foreignField: '_id', as: 'branchInfo' } },
      { $unwind: { path: '$branchInfo', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'companies', localField: 'companyIdObj', foreignField: '_id', as: 'companyInfo' } },
      { $unwind: { path: '$companyInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1, name: 1, serialNumber: 1, wdmsBaseUrl: 1, terminalId: 1,
          companyId: 1, branchId: 1, status: 1, lastSyncAt: 1,
          branch_name: '$branchInfo.name',
          company_name: '$companyInfo.name',
        },
      },
    ];

    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.deviceModel.aggregate(countPipeline).exec();
    const total = countResult[0]?.total || 0;

    if (Object.keys(sort).length > 0) pipeline.push({ $sort: sort });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const data = await this.deviceModel.aggregate(pipeline).exec();
    return { data, count: total, page: parseInt(page), page_size: limit, total_pages: Math.ceil(total / limit) };
  }

  // Ping the EasyWDMS URL to check reachability (no real device needed to test the plumbing).
  async testConnection(baseUrl: string, tokenStr?: string): Promise<{ ok: boolean; message: string }> {
    if (!baseUrl) return { ok: false, message: 'No EasyWDMS URL provided' };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(baseUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: tokenStr ? { Authorization: `Token ${tokenStr}` } : {},
      });
      clearTimeout(timer);
      return { ok: true, message: `Reachable (HTTP ${res.status})` };
    } catch (e: any) {
      clearTimeout(timer);
      return { ok: false, message: `Unreachable: ${e.message}` };
    }
  }

  async testDevice(id: string): Promise<{ ok: boolean; message: string }> {
    const device = await this.deviceModel.findById(id);
    if (!device) throw new BadRequestException('Device not found');
    const result = await this.testConnection(device.wdmsBaseUrl, device.wdmsToken);
    device.set('status', result.ok ? 'Online' : 'Offline');
    if (result.ok) device.set('lastSyncAt', new Date());
    await device.save();
    return result;
  }

  async fetchTokenFromWdms(baseUrl: string, body: any): Promise<any> {
    const { username, password } = body;
    if (!baseUrl) throw new BadRequestException('EasyWDMS URL is required');
    if (!username || !password) throw new BadRequestException('Username and password are required');
    
    const url = `${baseUrl.replace(/\/$/, '')}/api-token-auth/`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.status === 200) {
        const data = await res.json();
        return { ok: true, token: data.token };
      } else {
        const errorData = await res.json().catch(() => ({}));
        const message = errorData.detail || errorData.non_field_errors?.[0] || 'Authentication failed';
        return { ok: false, message };
      }
    } catch (e: any) {
      return { ok: false, message: `Failed to connect to EasyWDMS: ${e.message}` };
    }
  }
}
