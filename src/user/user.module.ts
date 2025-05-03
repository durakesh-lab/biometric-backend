import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Correct import
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserSchema } from './user.entity'; // Correct schema import

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),  // Use 'User' as the model name (value) here
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService], // Export the UserService for use in other modules
})
export class UserModule {}
