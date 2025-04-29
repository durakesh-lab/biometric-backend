import { Injectable } from '@nestjs/common';

@Injectable()
export class MicroserviceService {
  // This method processes the user data received from the other microservice
  processUserData(data: any) {
    // Logic to process the received data
    console.log('Processing user data:', data);
    // You can modify the data or perform any operations as needed
    return { status: 'success', processedData: data }; // Return the processed data
  }
}
