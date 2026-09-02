import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as xlsx from 'xlsx';
import { Employee } from './employee.schema';
import { Company } from 'src/company/company.schema';
import { Branch } from 'src/branch/branch.schema';
import { Department } from 'src/department/department.schema';
import { Device } from 'src/device/device.schema';

// The ONLY fields an employee record may hold. Anything else the client sends
// (username / password / role / etc.) is dropped here — employees never get credentials.
const ALLOWED_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'mobile',
  'gender',
  'companyId',
  'branchId',
  'deptId',
  'employeeCode',
  'deviceUserId',
  'deviceLinks',
  'active_status',
  'joining_date',
  'date_of_birth',
];

@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
    @InjectModel(Branch.name) private branchModel: Model<Branch>,
    @InjectModel(Department.name) private deptModel: Model<Department>,
    @InjectModel(Device.name) private deviceModel: Model<Device>,
  ) {}

  async validateDeviceLinks(deviceLinks: any[]): Promise<void> {
    if (!Array.isArray(deviceLinks)) return;
    const seenIds = new Set<string>();
    for (const link of deviceLinks) {
      if (!link.deviceId) {
        throw new BadRequestException('Each device link must contain a valid deviceId');
      }
      if (seenIds.has(String(link.deviceId))) {
        throw new BadRequestException('Duplicate device ID in enrollment list');
      }
      seenIds.add(String(link.deviceId));
      if (Types.ObjectId.isValid(link.deviceId)) {
        const exists = await this.deviceModel.findById(link.deviceId);
        if (!exists) {
          throw new BadRequestException(`Device with ID "${link.deviceId}" does not exist`);
        }
      }
      // Schedule time validation (reserved for future requirements):
      // if (link.startTime && link.endTime && link.startTime >= link.endTime) {
      //   throw new BadRequestException(`Start time (${link.startTime}) must be before end time (${link.endTime})`);
      // }
    }
  }

  async enrollEmployee(id: string, body: { deviceUserId: string; deviceLinks?: any[] }): Promise<Employee> {
    const existing = await this.employeeModel.findById(id);
    if (!existing) throw new BadRequestException('Employee not found');

    const deviceUserId = String(body.deviceUserId || '').trim();
    if (deviceUserId) {
      const dup = await this.employeeModel.findOne({
        deviceUserId,
        _id: { $ne: existing._id },
      });
      if (dup) {
        throw new BadRequestException(
          `Device ID "${deviceUserId}" is already assigned to employee "${dup.firstName} ${dup.lastName}".`
        );
      }
    }

    const deviceLinks = body.deviceLinks || [];
    await this.validateDeviceLinks(deviceLinks);

    existing.deviceUserId = deviceUserId;
    existing.deviceLinks = deviceLinks;
    return existing.save();
  }

  // Build a clean, credential-free payload from arbitrary client input.
  private pick(body: any): Partial<Employee> {
    const out: any = {};
    for (const f of ALLOWED_FIELDS) {
      if (body[f] !== undefined && body[f] !== '') out[f] = body[f];
    }
    // the frontend sends the department id under `department`
    if (body.department !== undefined && body.department !== '') {
      out.deptId = body.department;
    }
    if (!out.active_status) out.active_status = 'Active';
    return out;
  }

  async generateNextDeviceUserId(): Promise<string> {
    const employees = await this.employeeModel.find({}, { deviceUserId: 1 }).exec();
    const numericCodes = employees
      .map((e) => {
        const val = e.deviceUserId || '';
        return parseInt(val, 10);
      })
      .filter((num) => !isNaN(num));

    const maxCode = numericCodes.length > 0 ? Math.max(...numericCodes) : 100;
    return (maxCode + 1).toString();
  }

  async updateStatus(id: string, active_status: string): Promise<Employee> {
    const existing = await this.employeeModel.findById(id);
    if (!existing) throw new BadRequestException('Employee not found');
    existing.active_status = active_status;
    if (!existing.inactivityPeriods) existing.inactivityPeriods = [];

    if (active_status === 'Inactive') {
      const openPeriod = existing.inactivityPeriods.find((p: any) => !p.to);
      if (!openPeriod) {
        existing.inactivityPeriods.push({ from: new Date(), to: null });
      }
      if (!existing.inactivatedAt) existing.inactivatedAt = new Date();
    } else {
      const openPeriod = existing.inactivityPeriods.find((p: any) => !p.to);
      if (openPeriod) {
        openPeriod.to = new Date();
      }
      existing.inactivatedAt = null as any;
    }
    return existing.save();
  }

  async createEmployee(body: any): Promise<Employee> {
    const payload = this.pick(body);
    if (!payload.firstName) throw new BadRequestException('First name is required');
    if (!payload.companyId || !payload.branchId) {
      throw new BadRequestException('Company and branch are required');
    }

    // Auto-generate Hardware Device User ID if omitted or empty
    if (!payload.deviceUserId || String(payload.deviceUserId).trim() === '') {
      payload.deviceUserId = await this.generateNextDeviceUserId();
    }

    if (payload.email) {
      const dup = await this.employeeModel.findOne({ email: payload.email });
      if (dup) {
        throw new BadRequestException(`Email "${payload.email}" is already assigned to employee "${dup.firstName} ${dup.lastName}".`);
      }
    }
    if (payload.employeeCode) {
      const dup = await this.employeeModel.findOne({ employeeCode: payload.employeeCode });
      if (dup) {
        throw new BadRequestException(`Employee Code "${payload.employeeCode}" is already assigned to employee "${dup.firstName} ${dup.lastName}".`);
      }
    }
    if (payload.deviceUserId) {
      const dup = await this.employeeModel.findOne({ deviceUserId: payload.deviceUserId });
      if (dup) {
        throw new BadRequestException(`Device ID "${payload.deviceUserId}" is already assigned to employee "${dup.firstName} ${dup.lastName}".`);
      }
    }
    if (payload.deviceLinks) {
      await this.validateDeviceLinks(payload.deviceLinks);
    }
    const employee = new this.employeeModel(payload);
    return employee.save();
  }

  async updateEmployee(id: string, body: any): Promise<any> {
    const existing = await this.employeeModel.findById(id);
    if (!existing) throw new BadRequestException('Employee not found');
    const payload = this.pick(body);
    if (payload.email) {
      const dup = await this.employeeModel.findOne({
        email: payload.email,
        _id: { $ne: existing._id },
      });
      if (dup) {
        throw new BadRequestException(`Email "${payload.email}" is already assigned to employee "${dup.firstName} ${dup.lastName}".`);
      }
    }
    if (payload.employeeCode) {
      const dup = await this.employeeModel.findOne({
        employeeCode: payload.employeeCode,
        _id: { $ne: existing._id },
      });
      if (dup) {
        throw new BadRequestException(`Employee Code "${payload.employeeCode}" is already assigned to employee "${dup.firstName} ${dup.lastName}".`);
      }
    }
    if (payload.deviceUserId) {
      const dup = await this.employeeModel.findOne({
        deviceUserId: payload.deviceUserId,
        _id: { $ne: existing._id },
      });
      if (dup) {
        throw new BadRequestException(`Device ID "${payload.deviceUserId}" is already assigned to employee "${dup.firstName} ${dup.lastName}".`);
      }
    }
    if (payload.deviceLinks) {
      await this.validateDeviceLinks(payload.deviceLinks);
    }
    const periods = Array.isArray(existing.inactivityPeriods) ? [...existing.inactivityPeriods] : [];
    if (payload.active_status === 'Inactive') {
      const openPeriod = periods.find((p: any) => !p.to);
      if (!openPeriod) {
        periods.push({ from: new Date(), to: null });
      }
      payload.inactivityPeriods = periods;
      if (!existing.inactivatedAt) payload.inactivatedAt = new Date();
    } else if (payload.active_status === 'Active') {
      const openPeriod = periods.find((p: any) => !p.to);
      if (openPeriod) {
        openPeriod.to = new Date();
      }
      payload.inactivityPeriods = periods;
      payload.inactivatedAt = null as any;
    }
    existing.set(payload);
    return existing.save();
  }

  async deleteEmployee(id: string): Promise<{ message: string }> {
    const result = await this.employeeModel.findByIdAndDelete(id);
    return { message: result ? 'Employee deleted successfully' : 'Employee not found' };
  }

  async deleteEmployees(ids: string[]): Promise<{ message: string; deletedCount?: number }> {
    const objectIds: Types.ObjectId[] = [];
    const invalidIds: string[] = [];
    for (const id of ids) {
      if (Types.ObjectId.isValid(id)) objectIds.push(new Types.ObjectId(id));
      else invalidIds.push(id);
    }
    if (invalidIds.length) {
      throw new BadRequestException(`Invalid employee IDs: ${invalidIds.join(', ')}`);
    }
    const result = await this.employeeModel.deleteMany({ _id: { $in: objectIds } }).exec();
    if (result.deletedCount === 0) return { message: 'No employees found to delete' };
    return {
      message: `Deleted ${result.deletedCount} employees successfully`,
      deletedCount: result.deletedCount,
    };
  }

  async findById(id: string): Promise<any> {
    const objectId = new Types.ObjectId(id);
    const result = await this.employeeModel.aggregate([
      { $match: { _id: objectId } },
      { $addFields: { deptObjId: { $convert: { input: '$deptId', to: 'objectId', onError: null, onNull: null } } } },
      { $lookup: { from: 'departments', localField: 'deptObjId', foreignField: '_id', as: 'department' } },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          firstName: 1, lastName: 1, email: 1, mobile: 1, gender: 1,
          companyId: 1, branchId: 1, deptId: 1, employeeCode: 1, deviceUserId: 1, deviceLinks: 1,
          active_status: 1, joining_date: 1, date_of_birth: 1,
          department: { _id: 1, name: 1, dept_code: 1, branchId: 1 },
        },
      },
    ]);
    return result[0] || null;
  }

  // Paginated, filtered list with department/branch/company names joined in.
  // branchId/companyId are OPTIONAL: pass them to scope to one branch (Branch
  // Employees), or omit them to list every employee (Employee Directory).
  async getAllEmployees(branchId: string, companyId: string, query: any): Promise<any> {
    const {
      page = 1,
      page_size = 10,
      search = '',
      ordering = '',
      firstName = '',
      lastName = '',
      email = '',
      department = '',
      active_status = '',
      branch = '',
    } = query;

    const filter: any = {};
    if (branchId) filter.branchId = branchId;
    if (companyId) filter.companyId = companyId;
    // `branch` query param lets the Directory narrow to one branch (optional filter).
    if (branch) filter.branchId = branch;

    if (search) {
      const rx = new RegExp(search, 'i');
      filter.$or = [
        { mobile: Number(search) || null },
        { firstName: rx },
        { lastName: rx },
        { email: rx },
        { employeeCode: rx },
        { deviceUserId: rx },
      ];
    }
    if (firstName) filter.firstName = new RegExp(firstName, 'i');
    if (lastName) filter.lastName = new RegExp(lastName, 'i');
    if (email) filter.email = new RegExp(email, 'i');
    if (department) filter.deptId = department;
    if (active_status) filter.active_status = active_status;

    const sort: any = {};
    if (ordering) {
      const dir = ordering.startsWith('-') ? -1 : 1;
      const field = ordering.startsWith('-') ? ordering.substring(1) : ordering;
      sort[field] = dir;
    }

    const skip = (page - 1) * page_size;
    const limit = parseInt(page_size);

    const pipeline: any[] = [
      { $match: filter },
      {
        $addFields: {
          deptIdObj: { $convert: { input: '$deptId', to: 'objectId', onError: null, onNull: null } },
          branchIdObj: { $convert: { input: '$branchId', to: 'objectId', onError: null, onNull: null } },
          companyIdObj: { $convert: { input: '$companyId', to: 'objectId', onError: null, onNull: null } },
          deviceObjIds: {
            $map: {
              input: { $ifNull: ['$deviceLinks', []] },
              as: 'dl',
              in: { $convert: { input: '$$dl.deviceId', to: 'objectId', onError: null, onNull: null } },
            },
          },
        },
      },
      { $lookup: { from: 'departments', localField: 'deptIdObj', foreignField: '_id', as: 'departmentInfo' } },
      { $unwind: { path: '$departmentInfo', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'branches', localField: 'branchIdObj', foreignField: '_id', as: 'branchesInfo' } },
      { $unwind: { path: '$branchesInfo', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'companies', localField: 'companyIdObj', foreignField: '_id', as: 'companiesInfo' } },
      { $unwind: { path: '$companiesInfo', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'devices', localField: 'deviceObjIds', foreignField: '_id', as: 'linkedDevicesInfo' } },
      {
        $project: {
          _id: 1, firstName: 1, lastName: 1, email: 1, mobile: 1, gender: 1,
          branchId: 1, companyId: 1, employeeCode: 1, deviceUserId: 1, deviceLinks: 1,
          active_status: 1, joining_date: 1, date_of_birth: 1,
          dept_code: '$departmentInfo.dept_code',
          dept_id: '$departmentInfo._id',
          dept_name: '$departmentInfo.name',
          branchCode: '$branchesInfo.branchCode',
          branch_name: '$branchesInfo.name',
          company_Id: '$companiesInfo.companyId',
          company_name: '$companiesInfo.name',
          linkedDevices: {
            $map: {
              input: { $ifNull: ['$linkedDevicesInfo', []] },
              as: 'dev',
              in: { _id: '$$dev._id', name: '$$dev.name', status: '$$dev.status', serialNumber: '$$dev.serialNumber' },
            },
          },
        },
      },
    ];

    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.employeeModel.aggregate(countPipeline).exec();
    const total = countResult[0]?.total || 0;

    if (Object.keys(sort).length > 0) pipeline.push({ $sort: sort });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const data = await this.employeeModel.aggregate(pipeline).exec();

    return {
      data,
      count: total,
      page: parseInt(page),
      page_size: parseInt(page_size),
      total_pages: Math.ceil(total / limit),
    };
  }

  async checkAndVerifyFields(body: any): Promise<{ status: boolean; message?: string }> {
    const idFilter = body.id ? { _id: { $ne: body.id } } : {};

    if (body.field === 'email') {
      const check = await this.employeeModel.find({ email: body.email, ...idFilter });
      return check.length
        ? { status: false, message: 'Email already exists' }
        : { status: true };
    }
    if (body.field === 'employeeCode') {
      const check = await this.employeeModel.find({ employeeCode: body.employeeCode, ...idFilter });
      return check.length
        ? { status: false, message: 'Employee code already exists' }
        : { status: true };
    }
    if (body.field === 'deviceUserId') {
      const check = await this.employeeModel.find({ deviceUserId: body.deviceUserId, ...idFilter });
      return check.length
        ? { status: false, message: 'Device ID already exists' }
        : { status: true };
    }
    return { status: false, message: 'Invalid field specified' };
  }

  // Bulk import from a spreadsheet. Resolves company/branch/department by their codes.
  async importEmployees(filePath: string): Promise<any> {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheet]);

    const candidates = rows
      .map((row: any) => {
        if (!row['First Name'] || !row['Branch Code'] || !row['Company Id']) return null;
        return {
          firstName: row['First Name'],
          lastName: row['Last Name'] || '',
          email: row.Email || null,
          mobile: row.Mobile,
          gender: row.Gender,
          employeeCode: row['Employee Code'] || null,
          deviceUserId: row['Device User ID'] || '',
          active_status: row['active status'] === 'Inactive' ? 'Inactive' : 'Active',
          branchCode: row['Branch Code'],
          companyId: row['Company Id'],
          deptCode: row['Department Code'],
          joining_date: row['Date of Joining'],
          date_of_birth: row['date of birth'],
        };
      })
      .filter((r) => r !== null);

    const resolved = await Promise.all(
      candidates.map(async (emp: any) => {
        // skip if an employee with this email already exists
        if (emp.email) {
          const dup = await this.employeeModel.findOne({ email: emp.email });
          if (dup) return null;
        }
        // skip if an employee with this deviceUserId already exists
        if (emp.deviceUserId) {
          const dup = await this.employeeModel.findOne({ deviceUserId: emp.deviceUserId });
          if (dup) return null;
        }
        const company = await this.companyModel.findOne({ companyId: emp.companyId });
        if (!company) return null;
        emp.companyId = company._id;

        const branch = await this.branchModel.findOne({ branchCode: emp.branchCode });
        if (!branch) return null;
        delete emp.branchCode;
        emp.branchId = branch._id;

        if (emp.deptCode) {
          const dept = await this.deptModel.findOne({ dept_code: emp.deptCode });
          if (dept) emp.deptId = dept._id;
        }
        delete emp.deptCode;
        return emp;
      }),
    );

    const newEmployees = resolved.filter((e) => e !== null);
    try {
      await this.employeeModel.insertMany(newEmployees);
      return { status: true, message: 'Employees imported successfully', count: newEmployees.length };
    } catch (error) {
      return { status: false, message: error.message };
    }
  }
}
