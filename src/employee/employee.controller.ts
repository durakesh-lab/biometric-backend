import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  // Create an employee (attendance record — no credentials are created).
  @Post()
  create(@Body() body: any) {
    return this.employeeService.createEmployee(body);
  }

  // Paginated list for a branch/company (body carries branchId + companyId, query carries filters).
  @Post('list')
  list(@Body() body: any, @Query() query: any) {
    const { branchId, companyId } = body;
    return this.employeeService.getAllEmployees(branchId, companyId, query);
  }

  // Company-wide directory — every employee, all branches. companyId optional.
  @Post('list-all')
  listAll(@Body() body: any, @Query() query: any) {
    return this.employeeService.getAllEmployees('', body?.companyId || '', query);
  }

  // Bulk import from .xlsx/.xls/.csv
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
          cb(null, `${Date.now()}-${safe}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const ok =
          /\.(xlsx|xls|csv)$/i.test(file.originalname) ||
          [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
          ].includes(file.mimetype);
        cb(ok ? null : new BadRequestException('Only .xlsx/.xls/.csv files are allowed'), ok);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  import(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.employeeService.importEmployees(file.path);
  }

  // Bulk delete
  @Post('delete-bulk')
  deleteBulk(@Body() body: { ids: string[] }) {
    return this.employeeService.deleteEmployees(body.ids);
  }

  // Uniqueness check (email / employeeCode) for inline form validation
  @Post('checkandverifyfields')
  checkAndVerify(@Body() body: any) {
    return this.employeeService.checkAndVerifyFields(body);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.employeeService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.employeeService.updateEmployee(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeeService.deleteEmployee(id);
  }
}
