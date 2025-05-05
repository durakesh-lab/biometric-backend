
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

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsIn(['Super Admin', 'HR Admin', 'Manager', 'Employee', 'Guest'])
  role: string;
}
