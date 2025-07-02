import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { DatabaseConfig } from './config/database.config';
import { validate } from './config/validation.config';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CourseModule } from './modules/course/course.module';
import { AssignmentModule } from './modules/assignment/assignment.module';
import { GradeModule } from './modules/grade/grade.module';
import { HealthModule } from './modules/health/health.module';
import { SeedModule } from './seeds/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig
    }),
    AuthModule,
    UserModule,
    CourseModule,
    AssignmentModule,
    GradeModule,
    HealthModule,
    SeedModule
  ],
  controllers: [AppController],
  providers: []
})
export class AppModule {}
