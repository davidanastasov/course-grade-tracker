import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MongoTransformInterceptor } from './common/interceptors/mongo-transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // Apply MongoDB ID transformation globally
  app.useGlobalInterceptors(new MongoTransformInterceptor());

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  // Enable CORS for frontend integration
  app.enableCors({
    origin: true,
    credentials: true
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Course Grade Tracker API')
    .setDescription('API for managing courses, assignments, grades, and student enrollments')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header'
      },
      'JWT-auth'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true
    }
  });

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}

bootstrap();
