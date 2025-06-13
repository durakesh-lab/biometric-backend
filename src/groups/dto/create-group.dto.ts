// 2. dto/create-group.dto.ts
import { IsNotEmpty, IsString, IsArray, IsMongoId } from 'class-validator';

export class CreateGroupDto {
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsNotEmpty()
  @IsString()
  description: string;
    @IsNotEmpty()
  @IsString()
  color: string;
    @IsNotEmpty()
  @IsString()
  startTime: string;
      @IsNotEmpty()
  @IsString()
  endTime: string;
  @IsArray()
  @IsMongoId({ each: true })
  members: string[];
}
