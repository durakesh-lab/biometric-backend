import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as xlsx from 'xlsx';
import { Employee } from './employee.schema';
import { Company } from 'src/company/company.schema';
import { Branch } from 'src/branch/branch.schema';
import { Department } from 'src/department/department.schema';

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
  ) {}

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

  async createEmployee(body: any): Promise<Employee> {
    const payload = this.pick(body);
    if (!payload.firstName) throw new BadRequestException('First name is required');
    if (!payload.companyId || !payload.branchId) {
      throw new BadRequestException('Company and branch are required');
    }
    const employee = new this.employeeModel(payload);
    return employee.save();
  }

  async updateEmployee(id: string, body: any): Promise<any> {
    const existing = await this.employeeModel.findById(id);
    if (!existing) throw new BadRequestException('Employee not found');
    const payload = this.pick(body);
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
          companyId: 1, branchId: 1, deptId: 1, employeeCode: 1, deviceUserId: 1,
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
        },
      },
      { $lookup: { from: 'departments', localField: 'deptIdObj', foreignField: '_id', as: 'departmentInfo' } },
      { $unwind: { path: '$departmentInfo', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'branches', localField: 'branchIdObj', foreignField: '_id', as: 'branchesInfo' } },
      { $unwind: { path: '$branchesInfo', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'companies', localField: 'companyIdObj', foreignField: '_id', as: 'companiesInfo' } },
      { $unwind: { path: '$companiesInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1, firstName: 1, lastName: 1, email: 1, mobile: 1, gender: 1,
          branchId: 1, companyId: 1, employeeCode: 1, deviceUserId: 1,
          active_status: 1, joining_date: 1, date_of_birth: 1,
          dept_code: '$departmentInfo.dept_code',
          dept_id: '$departmentInfo._id',
          dept_name: '$departmentInfo.name',
          branchCode: '$branchesInfo.branchCode',
          branch_name: '$branchesInfo.name',
          company_Id: '$companiesInfo.companyId',
          company_name: '$companiesInfo.name',
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
    if (body.field === 'email') {
      const check = await this.employeeModel.find({ email: body.email });
      return check.length
        ? { status: false, message: 'Email already exists' }
        : { status: true };
    }
    if (body.field === 'employeeCode') {
      const check = await this.employeeModel.find({ employeeCode: body.employeeCode });
      return check.length
        ? { status: false, message: 'Employee code already exists' }
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
