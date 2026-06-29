import { Injectable } from '@nestjs/common';

@Injectable()
export class LeavesRequestService {
  getHello(): string {
    return 'Hello World!';
  }
}
