import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SettingService } from './setting.service';
import { Setting } from './schemas/setting.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  async getAll(): Promise<Setting[]> {
    return this.settingService.getAllSettings();
  }

  @Get(':type')
  async getByType(@Param('type') type: string): Promise<Setting> {
    return this.settingService.getSettingByType(type);
  }
    @Post(':type')
  async postByType(@Param('type') type: string,@Body() body:any): Promise<Setting> {
    return this.settingService.postSettingByType(body);
  }
}
