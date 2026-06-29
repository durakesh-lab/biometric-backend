import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateSubPermissionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsMongoId()
  @IsNotEmpty()
  parentPermission: string;
}