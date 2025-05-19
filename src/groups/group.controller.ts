// 4. group.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  create(@Body() dto: CreateGroupDto) {
    return this.groupService.createGroup(dto);
  }

  @Post(':groupId/add-members')
  addMembers(@Param('groupId') groupId: string, @Body('members') members: string[]) {
    return this.groupService.addMembers(groupId, members);
  }

  @Get(':groupId')
  getGroup(@Param('groupId') groupId: string) {
    return this.groupService.getGroupWithMembers(groupId);
  }

  @Get()
  getAll() {
    return this.groupService.getAllGroups();
  }
}
