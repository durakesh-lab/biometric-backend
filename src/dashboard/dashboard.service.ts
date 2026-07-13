import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance } from '../attendance/attendance.schema';
import { Company } from '../company/company.schema';
import { Employee } from '../employee/employee.schema';
import { LeaveRequest } from '../leaves/leaves-request.schema';

type DashboardQuery = {
  companyId?: string;
  branchId?: string;
};

type TrendPoint = {
  label: string;
  date: string;
  present: number;
  absent: number;
};

type IndustryPoint = {
  label: string;
  value: number;
  color: string;
};

type IndustrySource = {
  industry?: string | null;
};

type EmployeeScope = {
  active_status: 'Active';
  companyId?: string;
  branchId?: string;
};

const INDUSTRY_COLORS = [
  '#0E9F6E',
  '#34D399',
  '#10B981',
  '#6EE7B7',
  '#A7F3D0',
  '#60A5FA',
  '#F59E0B',
  '#F97316',
  '#8B5CF6',
  '#EC4899',
];

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<Employee>,
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<Attendance>,
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
    @InjectModel(LeaveRequest.name)
    private readonly leaveRequestModel: Model<LeaveRequest>,
  ) {}

  private buildScope(query: DashboardQuery = {}) {
    const companyId =
      typeof query.companyId === 'string' ? query.companyId.trim() : '';
    const branchId =
      typeof query.branchId === 'string' ? query.branchId.trim() : '';

    const scope: Record<string, string> = {};
    if (companyId) {
      scope.companyId = companyId;
    }
    if (branchId) {
      scope.branchId = branchId;
    }

    return { companyId, branchId, scope };
  }

  private toObjectIds(ids: Array<string | Types.ObjectId>) {
    const uniqueIds = [...new Set(ids.map((id) => String(id)))];
    return uniqueIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
  }

  private buildIndustryBreakdown(companies: IndustrySource[]): IndustryPoint[] {
    if (!companies.length) {
      return [];
    }

    const industryCount = new Map<string, number>();
    companies.forEach((company) => {
      const industry = company.industry?.trim() || 'Unknown';
      industryCount.set(industry, (industryCount.get(industry) || 0) + 1);
    });

    return Array.from(industryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], index) => ({
        label,
        value,
        color: INDUSTRY_COLORS[index % INDUSTRY_COLORS.length],
      }));
  }

  private async buildAttendanceTrend(
    employeeFilter: EmployeeScope,
    scope: Record<string, string>,
    totalEmployees: number,
  ): Promise<TrendPoint[]> {
    const today = new Date();
    const trend: TrendPoint[] = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - offset);

      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const distinctEmployeeIds = (await this.attendanceModel.distinct(
        'employeeId',
        {
          ...scope,
          timestamp: { $gte: dayStart, $lte: dayEnd },
        },
      )) as Array<string | Types.ObjectId>;

      const presentEmployeeIds = this.toObjectIds(distinctEmployeeIds);

      const present = presentEmployeeIds.length
        ? await this.employeeModel
            .countDocuments({
              ...employeeFilter,
              _id: { $in: presentEmployeeIds },
            })
            .exec()
        : 0;

      trend.push({
        label: day.toLocaleDateString('en-US', { weekday: 'short' }),
        date: day.toISOString().slice(0, 10),
        present,
        absent: Math.max(totalEmployees - present, 0),
      });
    }

    return trend;
  }

  async getOverview(query: DashboardQuery = {}) {
    const { companyId, branchId, scope } = this.buildScope(query);
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const employeeFilter: EmployeeScope = {
      active_status: 'Active',
      ...scope,
    };

    const totalEmployees = await this.employeeModel
      .countDocuments(employeeFilter)
      .exec();

    const distinctPresentIds = (await this.attendanceModel.distinct(
      'employeeId',
      {
        ...scope,
        timestamp: { $gte: startOfDay, $lte: endOfDay },
      },
    )) as Array<string | Types.ObjectId>;

    const companies = (await this.companyModel
      .find({})
      .select('industry')
      .lean()
      .exec()) as IndustrySource[];

    const distinctLeaveUsers = await this.leaveRequestModel.distinct(
      'username',
      {
        ...scope,
        leave_status: 'Accepted',
        startdate: { $lte: endOfDay },
        enddate: { $gte: startOfDay },
      },
    );

    const presentEmployeeIds = this.toObjectIds(distinctPresentIds);
    const present = presentEmployeeIds.length
      ? await this.employeeModel
          .countDocuments({
            ...employeeFilter,
            _id: { $in: presentEmployeeIds },
          })
          .exec()
      : 0;

    const attendanceTrend = await this.buildAttendanceTrend(
      employeeFilter,
      scope,
      totalEmployees,
    );
    const companyIndustryBreakdown = this.buildIndustryBreakdown(companies);

    return {
      counts: {
        present,
        absent: Math.max(totalEmployees - present, 0),
        onLeave: distinctLeaveUsers.length,
        totalEmployees,
      },
      attendanceTrend,
      companyIndustryBreakdown,
      selectedScope: {
        companyId: companyId || null,
        branchId: branchId || null,
      },
      updatedAt: now.toISOString(),
    };
  }
}
