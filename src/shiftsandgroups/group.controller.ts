import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { GroupService } from './group.service';
import {
  CreateGroupDto,
  UpdateGroupDto,
  UpdateGroupMembersDto,
} from './dto/create-group.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) { }

  @Get('next-group-code')
  getNextGroupCode(@Query('companyId') companyId?: string) {
    return this.groupService.generateNextGroupCode(companyId);
  }

  @Post()
  create(@Body() dto: CreateGroupDto) {
    return this.groupService.createGroup(dto);
  }

  @Get()
  getAll(@Query() query: any) {
    return this.groupService.getAllGroups(query);
  }

  // Kept as commented reference / API lookup
  // @Get(':id')
  // getGroup(@Param('id') id: string) {
  //   return this.groupService.getGroupById(id);
  // }

  @Put(':id')
  updateGroup(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupService.updateGroup(id, dto);
  }

  // Legacy edit endpoint fallback
  // @Post('/edit')
  // edit(@Body() dto: any) {
  //   const id = dto._id || dto.id;
  //   return this.groupService.updateGroup(id, dto);
  // }

  @Delete(':id')
  deleteGroup(@Param('id') id: string) {
    return this.groupService.deleteGroup(id);
  }

  /* =========================================================================
   * Dedicated Member Management Endpoints
   * ========================================================================= */
  @Get(':id/members-view')
  getGroupMembersView(@Param('id') id: string, @Query() query: any) {
    return this.groupService.getGroupMembersView(id, query);
  }

  @Put(':id/members')
  updateGroupMembers(
    @Param('id') id: string,
    @Body() dto: UpdateGroupMembersDto,
  ) {
    return this.groupService.updateGroupMembers(id, dto.memberEmpCodes || []);
  }

  // Incremental batch add endpoint (Frontend uses PUT :id/members for full atomic roster sync)
  // @Post(':id/add-members')
  // addMembers(
  //   @Param('id') id: string,
  //   @Body() body: any,
  // ) {
  //   const members = body.memberEmpCodes || body.members || [];
  //   return this.groupService.addMembersToGroup(id, members);
  // }

  // NOT USED: Member removal is handled via PUT :id/members (unchecking in modal) or DELETE :id (delete entire group)
  // @Delete(':id/members/:empCode')
  // removeMember(
  //   @Param('id') id: string,
  //   @Param('empCode') empCode: string,
  // ) {
  //   return this.groupService.removeMemberFromGroup(id, empCode);
  // }
}

