import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions, MongooseOptionsFactory } from '@nestjs/mongoose';

@Injectable()
export class DatabaseConfig implements MongooseOptionsFactory {
  constructor(private configService: ConfigService) {}

  createMongooseOptions(): MongooseModuleOptions {
    const uri = this.configService.get<string>('DATABASE_URI');
    const database = this.configService.get<string>('DATABASE_NAME');

    if (!uri) {
      throw new Error('DATABASE_URI is required');
    }

    return {
      uri,
      dbName: database,
      retryWrites: true,
      w: 'majority',
      authSource: 'admin'
    };
  }
}
