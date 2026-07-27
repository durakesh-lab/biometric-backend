import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Device } from './device.schema';

const ALLOWED_FIELDS = [
  'name',
  'serialNumber',
  'wdmsBaseUrl',
  'wdmsToken',
  'companyId',
  'branchId',
  'deptId',
  'location',
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

    // Check for duplicate serial number
    const existingSerial = await this.deviceModel.findOne({ serialNumber: payload.serialNumber });
    if (existingSerial) {
      throw new BadRequestException('A device with this serial number is already registered');
    }

    if (!payload.wdmsBaseUrl || !payload.wdmsToken) {
      throw new BadRequestException('EasyWDMS URL and WDMS Token are required');
    }

    const connTest = await this.testConnection(payload.wdmsBaseUrl, payload.wdmsToken, payload.serialNumber);
    payload.status = connTest.ok ? 'Online' : 'Offline';
    if (connTest.ok) {
      payload.lastSyncAt = new Date();
    }

    return new this.deviceModel(payload).save();
  }

  async updateDevice(id: string, body: any): Promise<any> {
    const existing = await this.deviceModel.findById(id);
    if (!existing) throw new BadRequestException('Device not found');
    const payload = this.pick(body);

    // Check for duplicate serial number if it is being changed
    if (payload.serialNumber && payload.serialNumber !== existing.serialNumber) {
      const existingSerial = await this.deviceModel.findOne({ serialNumber: payload.serialNumber });
      if (existingSerial) {
        throw new BadRequestException('A device with this serial number is already registered');
      }
    }

    const baseUrlChanged = payload.wdmsBaseUrl !== undefined && payload.wdmsBaseUrl !== existing.wdmsBaseUrl;
    const tokenChanged = payload.wdmsToken !== undefined && payload.wdmsToken !== existing.wdmsToken;
    const serialChanged = payload.serialNumber !== undefined && payload.serialNumber !== existing.serialNumber;

    if (baseUrlChanged || tokenChanged || serialChanged) {
      const baseUrl = payload.wdmsBaseUrl ?? existing.wdmsBaseUrl;
      const token = payload.wdmsToken ?? existing.wdmsToken;
      const serial = payload.serialNumber ?? existing.serialNumber;

      if (!baseUrl || !token) {
        throw new BadRequestException('EasyWDMS URL and WDMS Token are required');
      }

      const connTest = await this.testConnection(baseUrl, token, serial);
      payload.status = connTest.ok ? 'Online' : 'Offline';
      if (connTest.ok) {
        payload.lastSyncAt = new Date();
      }
    }

    existing.set(payload);
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
          _id: 1, name: 1, serialNumber: 1, wdmsBaseUrl: 1,
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

  // Ping the EasyWDMS URL to check reachability (or verify physical machine if serial is provided).
  async testConnection(
    baseUrl: string,
    tokenStr?: string,
    serialNumber?: string,
  ): Promise<{ ok: boolean; message: string }> {
    if (!baseUrl) return { ok: false, message: 'No EasyWDMS URL provided' };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    // If serialNumber is provided, verify the actual physical terminal status.
    const url = serialNumber
      ? `${baseUrl.replace(/\/$/, '')}/iclock/api/terminals/${serialNumber}/`
      : baseUrl;

    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: tokenStr ? { Authorization: `Token ${tokenStr}` } : {},
      });
      clearTimeout(timer);
      if (res.ok) {
        if (serialNumber) {
          const data = await res.json().catch(() => ({}));
          // Read terminal state from EasyWDMS response (1 = Online, 3 = Offline)
          const stateVal = data.state !== undefined ? Number(data.state) : null;
          if (stateVal !== null) {
            if (stateVal === 1) {
              return { ok: true, message: `Connected (Device Online)` };
            } else {
              return { ok: false, message: 'Device is Offline in EasyWDMS' };
            }
          }
          
          const state = String(data.status ?? '').toLowerCase();
          if (state === 'offline' || state === 'false') {
            return { ok: false, message: `Device is Offline in EasyWDMS` };
          }
          return { ok: true, message: `Connected (Device Online)` };
        }
        return { ok: true, message: `Reachable (HTTP ${res.status})` };
      } else {
        if (res.status === 404 && serialNumber) {
          return { ok: false, message: `Device Serial ${serialNumber} not found on EasyWDMS` };
        }
        return { ok: false, message: `Connection failed (HTTP ${res.status})` };
      }
    } catch (e: any) {
      clearTimeout(timer);
      return { ok: false, message: `Unreachable: ${e.message}` };
    }
  }

  async testDevice(id: string): Promise<{ ok: boolean; message: string }> {
    const device = await this.deviceModel.findById(id);
    if (!device) throw new BadRequestException('Device not found');
    const result = await this.testConnection(device.wdmsBaseUrl, device.wdmsToken, device.serialNumber);
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

  // Pure DB assignment update: companyId mandatory, updates companyId/branchId/deptId/location ONLY.
  // NEVER touches serialNumber, wdmsBaseUrl, wdmsToken, or connection tests.
  async assignDevice(id: string, body: any): Promise<Device> {
    const companyId = body.companyId ?? body.company_id;
    if (!companyId || companyId === '') {
      throw new BadRequestException('Company is required');
    }

    const device = await this.deviceModel.findById(id);
    if (!device) {
      throw new BadRequestException('Device not found');
    }

    const updateData: any = {
      companyId: companyId,
      branchId: body.branchId ?? body.branch ?? null,
      deptId: body.deptId ?? body.departmentId ?? null,
      location: body.location ?? null,
    };

    device.set(updateData);
    return device.save();
  }

  // Sanitized assignment list: includes company_name, branch_name, dept_name.
  // Excludes serialNumber, wdmsBaseUrl, and wdmsToken so sensitive WDMS info never leaves the server.
  async getAssignmentList(branchId: string, companyId: string, query: any): Promise<any> {
    const { page = 1, page_size = 10, search = '', ordering = '' } = query;

    const filter: any = {};
    if (branchId) filter.branchId = branchId;
    if (companyId) filter.companyId = companyId;
    if (search) {
      const rx = new RegExp(search, 'i');
      filter.$or = [{ name: rx }, { location: rx }];
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
          deptIdObj: { $convert: { input: '$deptId', to: 'objectId', onError: null, onNull: null } },
        },
      },
      { $lookup: { from: 'branches', localField: 'branchIdObj', foreignField: '_id', as: 'branchInfo' } },
      { $unwind: { path: '$branchInfo', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'companies', localField: 'companyIdObj', foreignField: '_id', as: 'companyInfo' } },
      { $unwind: { path: '$companyInfo', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'departments', localField: 'deptIdObj', foreignField: '_id', as: 'deptInfo' } },
      { $unwind: { path: '$deptInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          status: 1,
          companyId: 1,
          branchId: 1,
          deptId: 1,
          location: 1,
          company_name: '$companyInfo.name',
          branch_name: '$branchInfo.name',
          dept_name: '$deptInfo.name',
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
}
