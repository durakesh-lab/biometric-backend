import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';  // Corrected import
import { MicroserviceService } from './microservice.service';

@Controller('microservice')
export class MicroserviceController {
  constructor(private readonly microserviceService: MicroserviceService) {}

  // Simple route to check if the service is up
  @Get()
  getHello(): string {
    return 'Microservice is running!';
  }

  // Example of using a MessagePattern decorator to listen for messages from other microservices
  @MessagePattern('get_user_data')  // This listens for a 'get_user_data' message pattern
  getUserData(@Payload() data: any) {
    console.log('Received data from other microservice:', data);
    return this.microserviceService.processUserData(data);  // Call the service method to process the data
  }
}
