import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}