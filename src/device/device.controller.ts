import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DeviceService } from './device.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post()
  create(@Body() body: any) {
    return this.deviceService.createDevice(body);
  }

  // List — body may carry branchId/companyId to scope; omit for all devices.
  @Post('list')
  list(@Body() body: any, @Query() query: any) {
    return this.deviceService.getAllDevices(body?.branchId, body?.companyId, query);
  }

  // Test an EasyWDMS URL before saving (Register modal's "Test connection").
  @Post('test')
  test(@Body() body: any) {
    return this.deviceService.testConnection(body?.wdmsBaseUrl, body?.wdmsToken);
  }

  // Test a saved device (updates its status).
  @Post(':id/test')
  testById(@Param('id') id: string) {
    return this.deviceService.testDevice(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.deviceService.updateDevice(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deviceService.deleteDevice(id);
  }

  @Post('get-token')
  getToken(@Body() body: any) {
    return this.deviceService.fetchTokenFromWdms(body.wdmsBaseUrl, body);
  }
}
