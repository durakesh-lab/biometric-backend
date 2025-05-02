// export class CreateDepartmentDto {
//     name: string;
//     branchId: number;
//   }
  
import { IsNotEmpty, IsString, IsOptional, IsMongoId } from 'class-validator';

export class CreateDepartmentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsMongoId() // Ensures that branchId is a valid MongoDB ObjectId
  branchId: string;  // The branch the department belongs to

  @IsOptional()
  @IsString()
  otherDetails?: string;
}
