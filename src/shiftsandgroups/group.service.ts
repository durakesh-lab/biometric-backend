import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group, GroupDocument } from './groups.schema';
import { Shift } from './shift.schema';
import { Employee, EmployeeDocument } from '../employee/employee.schema';
import { Branch } from '../branch/branch.schema';
import { Department } from '../department/department.schema';
import { CreateGroupDto, UpdateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(Shift.name) private shiftModel: Model<Shift>,
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    @InjectModel(Branch.name) private branchModel: Model<Branch>,
    @InjectModel(Department.name) private departmentModel: Model<Department>,
  ) { }

  // Helper to convert 24h HH:mm string to total minutes
  private timeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  // 1. Auto-generate next unique Group Code per company e.g. "GRP-001"
  async generateNextGroupCode(companyId?: string): Promise<string> {
    const filter = companyId ? { companyId } : {};
    const groups = await this.groupModel.find(filter, { groupCode: 1 }).exec();
    const numericCodes = groups
      .map((g) => {
        const match = (g.groupCode || '').match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : NaN;
      })
      .filter((num) => !isNaN(num));

    const maxCode = numericCodes.length > 0 ? Math.max(...numericCodes) : 0;
    const nextNum = (maxCode + 1).toString().padStart(3, '0');
    return `GRP-${nextNum}`;
  }

  // 2. Validate Split Shift Overlap (Primary vs Secondary Shift)
  async checkShiftOverlap(assignedShiftIds: string[]): Promise<void> {
    if (!assignedShiftIds || assignedShiftIds.length <= 1) return;

    if (assignedShiftIds.length === 2) {
      if (assignedShiftIds[0] === assignedShiftIds[1]) {
        throw new BadRequestException(
          'Primary and Secondary shifts cannot be the exact same shift template',
        );
      }

      const shift1 = await this.shiftModel.findById(assignedShiftIds[0]).exec();
      const shift2 = await this.shiftModel.findById(assignedShiftIds[1]).exec();

      if (shift1 && shift2) {
        let s1 = this.timeToMinutes(shift1.startTime);
        let e1 = this.timeToMinutes(shift1.endTime);
        let s2 = this.timeToMinutes(shift2.startTime);
        let e2 = this.timeToMinutes(shift2.endTime);

        // Cross-midnight normalization
        if (e1 < s1) e1 += 24 * 60;
        if (e2 < s2) e2 += 24 * 60;

        // Check for overlap
        const isOverlap = s1 < e2 && s2 < e1;
        if (isOverlap) {
          throw new BadRequestException(
            `Shift Overlap Conflict: Primary shift "${shift1.name}" (${shift1.startTime}–${shift1.endTime}) overlaps with Secondary shift "${shift2.name}" (${shift2.startTime}–${shift2.endTime})! Split shifts must have non-overlapping working hours.`,
          );
        }
      }
    }
  }

  // 3. Strict Single Group Membership Rule: Check if any employee is already in another group
  async validateSingleGroupMembership(
    companyId: string,
    memberEmpCodes: string[],
    excludeGroupId?: string,
  ): Promise<void> {
    if (!memberEmpCodes || memberEmpCodes.length === 0) return;

    const filter: any = { companyId };
    if (excludeGroupId) {
      filter._id = { $ne: excludeGroupId };
    }

    const otherGroups = await this.groupModel.find(filter).exec();

    for (const code of memberEmpCodes) {
      const conflictingGroup = otherGroups.find(
        (g) => g.memberEmpCodes && g.memberEmpCodes.includes(code),
      );

      if (conflictingGroup) {
        // Find employee details for clear error messaging
        const emp = await this.employeeModel
          .findOne({
            $or: [{ deviceUserId: code }, { employeeCode: code }],
            companyId,
          })
          .exec();

        const empName = emp
          ? `${emp.firstName} ${emp.lastName || ''}`.trim()
          : `ID: ${code}`;

        throw new ConflictException(
          `Single Group Membership Conflict: Employee ${empName} (ID: ${code}) is already assigned to group "${conflictingGroup.name}". Please manually remove them from "${conflictingGroup.name}" first before adding them to another group.`,
        );
      }
    }
  }

  // 4. Create New Shift Group
  async createGroup(dto: CreateGroupDto): Promise<Group> {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Group Name is required');
    }
    if (!dto.companyId) {
      throw new BadRequestException('Company ID is required');
    }
    if (!dto.assignedShiftIds || dto.assignedShiftIds.length === 0) {
      throw new BadRequestException('At least 1 Primary Shift must be assigned to the group');
    }

    // Auto-generate groupCode if omitted
    if (!dto.groupCode || !dto.groupCode.trim()) {
      dto.groupCode = await this.generateNextGroupCode(dto.companyId);
    }

    // Check duplicate groupCode per company
    const existingCode = await this.groupModel.findOne({
      groupCode: dto.groupCode.trim(),
      companyId: dto.companyId,
    });
    if (existingCode) {
      throw new BadRequestException(`Group code "${dto.groupCode}" already exists for this company`);
    }

    // Check split shift overlap
    await this.checkShiftOverlap(dto.assignedShiftIds);

    // Clean memberEmpCodes and handle transfer
    const memberEmpCodes = Array.from(
      new Set((dto.memberEmpCodes || []).map((c) => String(c).trim()).filter(Boolean)),
    );

    if (memberEmpCodes.length > 0) {
      await this.groupModel.updateMany(
        { companyId: dto.companyId },
        { $pull: { memberEmpCodes: { $in: memberEmpCodes } } } as any,
      ).exec();
    }

    const group = new this.groupModel({
      ...dto,
      groupCode: dto.groupCode.trim(),
      assignedShiftIds: dto.assignedShiftIds,
      memberEmpCodes,
    });

    return group.save();
  }

  // 5. Get All Groups with Enriched Shift Details
  async getAllGroups(query: any): Promise<any[]> {
    const filter: any = {};
    if (query.companyId) filter.companyId = query.companyId;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { groupCode: { $regex: query.search, $options: 'i' } },
      ];
    }

    const groups = await this.groupModel.find(filter).sort({ createdAt: -1 }).exec();

    // Enrich groups with shift objects and employee member details
    const enrichedGroups = await Promise.all(
      groups.map(async (group: any) => {
        const shifts = await this.shiftModel
          .find({ _id: { $in: group.assignedShiftIds } })
          .exec();

        const assignedShiftNames = shifts.map(
          (s) => `${s.name} (${s.startTime} - ${s.endTime})`,
        );

        const memberCodes = group.memberEmpCodes || [];
        const members: any[] = memberCodes.length > 0
          ? await this.employeeModel
            .find({
              $or: [
                { deviceUserId: { $in: memberCodes } },
                { employeeCode: { $in: memberCodes } },
                { _id: { $in: memberCodes.filter((c) => Types.ObjectId.isValid(c)) } },
              ],
              companyId: group.companyId,
            })
            .select('firstName lastName deviceUserId employeeCode active_status')
            .exec()
          : [];

        return {
          ...group.toObject(),
          shifts,
          assignedShiftNames,
          memberCount: memberCodes.length,
          members: members.map((m: any) => ({
            _id: m._id,
            name: `${m.firstName} ${m.lastName || ''}`.trim(),
            empCode: m.employeeCode || m.deviceUserId || (m._id ? String(m._id) : ''),
          })),
        };
      }),
    );

    return enrichedGroups;
  }

  // getGroupById (commented out in controller)
  // async getGroupById(id: string): Promise<any> {
  //   const group: any = await this.groupModel.findById(id).exec();
  //   if (!group) {
  //     throw new NotFoundException(`Group with ID "${id}" not found`);
  //   }
  //   const shifts = await this.shiftModel
  //     .find({ _id: { $in: group.assignedShiftIds } })
  //     .exec();
  //   const memberCodes = group.memberEmpCodes || [];
  //   const members: any[] = memberCodes.length > 0
  //     ? await this.employeeModel
  //         .find({
  //           $or: [
  //             { deviceUserId: { $in: memberCodes } },
  //             { employeeCode: { $in: memberCodes } },
  //             { _id: { $in: memberCodes.filter((c) => Types.ObjectId.isValid(c)) } },
  //           ],
  //           companyId: group.companyId,
  //         })
  //         .exec()
  //     : [];
  //   return {
  //     ...group.toObject(),
  //     shifts,
  //     members: members.map((m: any) => ({
  //       _id: m._id,
  //       name: `${m.firstName} ${m.lastName || ''}`.trim(),
  //       empCode: m.employeeCode || m.deviceUserId || (m._id ? String(m._id) : ''),
  //     })),
  //     memberCount: memberCodes.length,
  //   };
  // }

  // 7. Update Group
  async updateGroup(id: string, dto: UpdateGroupDto): Promise<Group> {
    const existing: any = await this.groupModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`Group with ID "${id}" not found`);
    }

    // Check duplicate groupCode if modified
    if (dto.groupCode && dto.groupCode.trim() !== (existing.groupCode || '').trim()) {
      const dup = await this.groupModel
        .findOne({
          groupCode: dto.groupCode.trim(),
          companyId: dto.companyId || existing.companyId,
          _id: { $ne: existing._id },
        })
        .exec();

      if (dup) {
        throw new BadRequestException(`Group code "${dto.groupCode}" already exists for this company`);
      }
    }

    // Check shift overlap if shifts updated
    if (dto.assignedShiftIds) {
      await this.checkShiftOverlap(dto.assignedShiftIds);
    }

    if (dto.memberEmpCodes) {
      const memberEmpCodes = Array.from(
        new Set(dto.memberEmpCodes.map((c) => String(c).trim()).filter(Boolean)),
      );

      // Single Group Membership Transfer
      if (memberEmpCodes.length > 0) {
        await this.groupModel.updateMany(
          {
            companyId: dto.companyId || existing.companyId,
            _id: { $ne: id },
          },
          {
            $pull: { memberEmpCodes: { $in: memberEmpCodes } },
          } as any,
        ).exec();
      }
      dto.memberEmpCodes = memberEmpCodes;
    }

    existing.set(dto);
    return existing.save();
  }

  // 8. Delete Group
  async deleteGroup(id: string): Promise<{ message: string }> {
    const result = await this.groupModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Group with ID "${id}" not found`);
    }
    return { message: 'Shift group deleted successfully' };
  }

  // =========================================================================
  // 9. MANAGE MEMBERS TABLE: Full Roster View with Single Group Assignment Status
  // =========================================================================
  async getGroupMembersView(groupId: string, query: any = {}): Promise<any> {
    const group: any = await this.groupModel.findById(groupId).exec();
    if (!group) {
      throw new NotFoundException(`Shift group with ID "${groupId}" not found`);
    }

    const companyId = group.companyId;

    // Fetch all active employees in this company
    const employeeFilter: any = { companyId };
    if (query.search) {
      const rx = new RegExp(query.search, 'i');
      employeeFilter.$or = [
        { firstName: rx },
        { lastName: rx },
        { employeeCode: rx },
        { deviceUserId: rx },
      ];
    }
    if (query.branchId) {
      employeeFilter.branchId = query.branchId;
    }
    if (query.deptId) {
      employeeFilter.deptId = query.deptId;
    }

    const employees: any[] = await this.employeeModel.find(employeeFilter).sort({ firstName: 1 }).exec();

    // Fetch branches and departments in this company to map human-readable names
    const branches: any[] = await this.branchModel.find({
      $or: [{ companyId }, { _id: { $in: employees.map((e) => e.branchId).filter(Boolean) } }],
    }).exec();
    const branchMap = new Map<string, string>();
    branches.forEach((b: any) => branchMap.set(String(b._id), b.name));

    const departments: any[] = await this.departmentModel.find({
      $or: [{ company_id: companyId }, { _id: { $in: employees.map((e) => e.deptId).filter(Boolean) } }],
    }).exec();
    const deptMap = new Map<string, string>();
    departments.forEach((d: any) => deptMap.set(String(d._id), d.name));

    // Fetch all groups in this company to determine assignments
    const allCompanyGroups: any[] = await this.groupModel.find({ companyId }).exec();

    const targetGroupMemberCodes = new Set(group.memberEmpCodes || []);

    const enrichedEmployees = employees.map((emp: any) => {
      const empIdStr = String(emp._id);
      const deviceIdStr = (emp.deviceUserId || '').trim();
      const codeStr = (emp.employeeCode || '').trim();

      // Check if enrolled in this target group
      const isMember =
        (deviceIdStr && targetGroupMemberCodes.has(deviceIdStr)) ||
        (codeStr && targetGroupMemberCodes.has(codeStr)) ||
        targetGroupMemberCodes.has(empIdStr);

      // Check if enrolled in another group
      let assignedGroup: { id: string; name: string; groupCode: string } | null = null;
      for (const g of allCompanyGroups) {
        if (String(g._id) !== groupId) {
          const gCodes = new Set(g.memberEmpCodes || []);
          if (
            (deviceIdStr && gCodes.has(deviceIdStr)) ||
            (codeStr && gCodes.has(codeStr)) ||
            gCodes.has(empIdStr)
          ) {
            assignedGroup = {
              id: String(g._id),
              name: g.name,
              groupCode: g.groupCode || 'GRP',
            };
            break;
          }
        }
      }

      const branchName = branchMap.get(String(emp.branchId)) || '—';
      const departmentName = deptMap.get(String(emp.deptId)) || '—';

      let status = 'Available';
      if (isMember) {
        status = 'In this Group';
      } else if (assignedGroup) {
        status = 'Assigned to Other Group';
      }

      return {
        _id: emp._id,
        name: `${emp.firstName} ${emp.lastName || ''}`.trim(),
        firstName: emp.firstName,
        lastName: emp.lastName || '',
        empCode: emp.employeeCode || emp.deviceUserId || String(emp._id),
        deviceUserId: emp.deviceUserId || '',
        employeeCode: emp.employeeCode || '',
        gender: emp.gender || '—',
        active_status: emp.active_status || 'Active',
        branchId: emp.branchId,
        branchName,
        deptId: emp.deptId,
        departmentName,
        isMember,
        assignedGroup,
        status,
      };
    });

    return {
      group: {
        _id: group._id,
        name: group.name,
        groupCode: group.groupCode,
        companyId: group.companyId,
        memberCount: (group.memberEmpCodes || []).length,
      },
      employees: enrichedEmployees,
      totalCount: enrichedEmployees.length,
    };
  }

  // 10. Update Group Members with Single Group Membership Transfer Rule
  async updateGroupMembers(groupId: string, rawCodes: string[]): Promise<any> {
    const group = await this.groupModel.findById(groupId).exec();
    if (!group) {
      throw new NotFoundException(`Shift group with ID "${groupId}" not found`);
    }

    const memberEmpCodes = Array.from(
      new Set((rawCodes || []).map((c) => String(c).trim()).filter(Boolean)),
    );

    // Single Group Membership Rule:
    // Automatically transfer employees from other groups in the same company
    if (memberEmpCodes.length > 0) {
      await this.groupModel.updateMany(
        {
          companyId: group.companyId,
          _id: { $ne: groupId },
        },
        {
          $pull: { memberEmpCodes: { $in: memberEmpCodes } },
        } as any,
      ).exec();
    }

    group.memberEmpCodes = memberEmpCodes;
    const savedGroup = await group.save();

    return {
      success: true,
      message: `Shift group members updated successfully (${memberEmpCodes.length} members enrolled).`,
      group: savedGroup,
      enrolledCount: memberEmpCodes.length,
    };
  }

  // Incremental batch addition (commented out in controller)
  // async addMembersToGroup(groupId: string, newCodes: string[]): Promise<any> {
  //   const group = await this.groupModel.findById(groupId).exec();
  //   if (!group) {
  //     throw new NotFoundException(`Shift group with ID "${groupId}" not found`);
  //   }
  //   const cleanNewCodes = (newCodes || []).map((c) => String(c).trim()).filter(Boolean);
  //   const existingCodes = new Set(group.memberEmpCodes || []);
  //   cleanNewCodes.forEach((c) => existingCodes.add(c));
  //   const combinedCodes = Array.from(existingCodes);
  //   return this.updateGroupMembers(groupId, combinedCodes);
  // }

  // NOT USED: Member removal is handled via updateGroupMembers (unchecking in modal) or deleteGroup (delete entire group)
  // async removeMemberFromGroup(groupId: string, empCode: string): Promise<any> {
  //   const group = await this.groupModel.findById(groupId).exec();
  //   if (!group) {
  //     throw new NotFoundException(`Shift group with ID "${groupId}" not found`);
  //   }
  //   const cleanCode = String(empCode).trim();
  //   group.memberEmpCodes = (group.memberEmpCodes || []).filter((c) => c !== cleanCode);
  //   const savedGroup = await group.save();
  //   return {
  //     success: true,
  //     message: `Member "${empCode}" removed from shift group.`,
  //     group: savedGroup,
  //     enrolledCount: group.memberEmpCodes.length,
  //   };
  // }
}