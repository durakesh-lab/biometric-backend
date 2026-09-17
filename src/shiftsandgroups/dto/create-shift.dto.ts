import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  Matches,
  IsIn,
  ArrayMinSize,
} from 'class-validator';

export const ALL_SEVEN_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type DayOfWeek = typeof ALL_SEVEN_DAYS[number];

export class CreateShiftDto {
  @IsNotEmpty()
  @IsString()
  name: string; // Shift Name

  @IsOptional()
  @IsString()
  shiftCode?: string; // Shift Code (e.g. SHIFT-001)

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in 24-hour HH:mm format (e.g. 17:00)',
  })
  startTime: string; // Start Time (24h Format HH:mm)

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in 24-hour HH:mm format (e.g. 21:00)',
  })
  endTime: string; // End Time (24h Format HH:mm)

  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 working day must be selected from the 7 days' })
  @IsIn(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], {
    each: true,
    message: 'Working days must be selected from: Mon, Tue, Wed, Thu, Fri, Sat, Sun',
  })
  workingDays: string[]; // Select Working Days

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deviceIds?: string[]; // Allowed Attendance Biometric Devices

  @IsOptional()
  @IsString()
  description?: string; // Optional comments / notes for the shift

  @IsNotEmpty()
  @IsString()
  companyId: string; // Active Working Organization Context
}

export class UpdateShiftDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  shiftCode?: string; // Shift Code

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in 24-hour HH:mm format (e.g. 17:00)',
  })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in 24-hour HH:mm format (e.g. 21:00)',
  })
  endTime?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 working day must be selected from the 7 days' })
  @IsIn(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], {
    each: true,
    message: 'Working days must be selected from: Mon, Tue, Wed, Thu, Fri, Sat, Sun',
  })
  workingDays?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deviceIds?: string[];

  @IsOptional()
  @IsString()
  description?: string; // Optional comments / notes for the shift

  @IsOptional()
  @IsString()
  companyId?: string;
}
