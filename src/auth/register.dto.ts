
// export class RegisterDto {
//   username: string;
//   password: string;
//   role: 'Super Admin' | 'HR Admin' | 'Manager' | 'Employee' | 'Guest';  // Add role field
// }

import { IsEmail, IsNotEmpty, IsString, IsIn, IsOptional, MinLength, IsNumber } from 'class-validator';

// Every field is decorated so the global ValidationPipe `whitelist` keeps it
// (undecorated fields get stripped). `role` is validated but is also ignored
// server-side for public register (forced to 'Employee' in auth.service).
export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6) // baseline password policy
  password: string;

  @IsOptional()
  @IsIn(['Super Admin', 'HR Admin', 'Manager', 'Employee', 'Guest'])
  role?: 'Super Admin' | 'HR Admin' | 'Manager' | 'Employee' | 'Guest';

  @IsOptional()
  @IsIn(['Active', 'Inactive'])
  active_status?: 'Active' | 'Inactive';

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() joining_date?: string;
  @IsOptional() @IsString() date_of_birth?: string;
  @IsOptional() @IsString() branchId?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsNumber() mobile?: number;
  @IsOptional() @IsString() gender?: string;
}
