// export class RegisterDto {
//   username: string;
//   password: string;
// }

export class RegisterDto {
  username: string;
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
}
