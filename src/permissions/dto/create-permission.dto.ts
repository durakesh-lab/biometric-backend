import { IsNotEmpty, IsString, IsArray } from 'class-validator';

export class CreatePermissionDto {
  @IsNotEmpty()
  @IsString()
  role: string;

  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}