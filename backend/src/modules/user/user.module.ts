import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './entities/user.entity';
import { Enrollment, EnrollmentSchema } from './entities/enrollment.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Enrollment.name, schema: EnrollmentSchema }
    ])
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
