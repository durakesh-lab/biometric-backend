
// export class RegisterDto {
//   username: string;
//   password: string;
//   role: 'Super Admin' | 'HR Admin' | 'Manager' | 'Employee' | 'Guest';  // Add role field
// }

import { IsEmail, IsNotEmpty, IsString, IsIn } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
  role: 'Super Admin' | 'HR Admin' | 'Manager' | 'Employee' | 'Guest';  // Add role field,
  active_status:"Active" | "Inactive";
  email:string;
  firstName: string;
  lastName: string;
  joining_date: string;
  date_of_birth:string;
  branchId:string;
  companyId:string;
  department:string
}
