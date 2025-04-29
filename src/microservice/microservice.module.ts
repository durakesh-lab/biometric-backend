import { Module } from '@nestjs/common';
import { MicroserviceService } from './microservice.service';
import { MicroserviceController } from './microservice.controller';

@Module({
  providers: [MicroserviceService],
  controllers: [MicroserviceController],
})
export class MicroserviceModule {}
