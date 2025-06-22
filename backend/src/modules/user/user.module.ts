import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { Enrollment } from './entities/enrollment.entity';
import { Course } from '../course/entities/course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Enrollment, Course])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
