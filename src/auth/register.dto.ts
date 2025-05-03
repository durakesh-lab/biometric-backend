// export class RegisterDto {
//   username: string;
//   password: string;
// }

export class RegisterDto {
  username: string;
  password: string;
  role: 'Super Admin' | 'HR Admin' | 'Manager' | 'Employee' | 'Guest';  // Add role field
}
