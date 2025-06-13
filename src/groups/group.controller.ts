// 4. group.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  create(@Body() dto: any) {
    return this.groupService.createGroup(dto);
  }
    @Post("/edit")
  edit(@Body() dto: any) {
    return this.groupService.editGroup(dto._id,dto);
  }

  @Post(':groupId/add-members')
  addMembers(@Param('groupId') groupId: string, @Body('members') members: string[]) {
    return this.groupService.addMembers(groupId, members);
  }

  @Get(':groupId')
  getGroup(@Param('groupId') groupId: string) {
    return this.groupService.getGroupWithMembers(groupId);
  }
    @Get('delete/:groupId')
  deleteGroup(@Param('groupId') groupId: string) {
    return this.groupService.deleteGroup(groupId);
  }

  @Get()
  getAll() {
    return this.groupService.getAllGroups();
  }
}
