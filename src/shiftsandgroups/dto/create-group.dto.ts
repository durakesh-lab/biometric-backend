import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class CreateGroupDto {
  @IsNotEmpty()
  @IsString()
  name: string; // Group Name (e.g. "Field Technicians Taskforce")

  @IsOptional()
  @IsString()
  groupCode?: string; // Group Code (e.g. "GRP-001")

  @IsNotEmpty()
  @IsString()
  companyId: string; // Active Working Organization Context

  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 shift must be assigned as Primary Shift' })
  @ArrayMaxSize(2, { message: 'A group can have at most 2 shifts (Primary + Secondary/Split)' })
  @IsString({ each: true })
  assignedShiftIds: string[]; // Array of Shift Object IDs

  @IsOptional()
  @IsString()
  description?: string; // Optional description for the group

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberEmpCodes?: string[]; // Array of Employee Device User IDs
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  groupCode?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 shift must be assigned as Primary Shift' })
  @ArrayMaxSize(2, { message: 'A group can have at most 2 shifts (Primary + Secondary/Split)' })
  @IsString({ each: true })
  assignedShiftIds?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberEmpCodes?: string[];
}

export class UpdateGroupMembersDto {
  @IsArray()
  @IsString({ each: true })
  memberEmpCodes: string[];
}
