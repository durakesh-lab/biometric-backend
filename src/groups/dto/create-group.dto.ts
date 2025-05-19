// 2. dto/create-group.dto.ts
import { IsNotEmpty, IsString, IsArray, IsMongoId } from 'class-validator';

export class CreateGroupDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsArray()
  @IsMongoId({ each: true })
  members: string[];
}
