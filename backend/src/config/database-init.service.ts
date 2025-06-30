import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { SeedService } from '../seeds/seed.service';

@Injectable()
export class DatabaseInitService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseInitService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly seedService: SeedService
  ) {}

  async onModuleInit() {
    const nodeEnv = this.configService.get('NODE_ENV', 'development');

    this.logger.log('Initializing database...');

    try {
      // Wait for database connection
      await this.waitForDatabase();

      // Run migrations
      await this.runMigrations();

      // Run seeds (only in development/staging)
      if (nodeEnv !== 'production') {
        await this.runSeeds();
      }

      this.logger.log('Database initialization completed successfully');
    } catch (error) {
      this.logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async waitForDatabase(maxRetries = 10, delay = 2000): Promise<void> {
    let retries = 0;

    while (retries < maxRetries) {
      try {
        await this.dataSource.query('SELECT 1');
        this.logger.log('Database connection established');
        return;
      } catch {
        retries++;
        this.logger.warn(
          `Database connection attempt ${retries}/${maxRetries} failed. Retrying in ${delay}ms...`
        );

        if (retries >= maxRetries) {
          throw new Error(`Could not connect to database after ${maxRetries} attempts`);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  private async runMigrations(): Promise<void> {
    try {
      this.logger.log('Running database migrations...');

      // Check if there are pending migrations
      const pendingMigrations = await this.dataSource.showMigrations();

      if (pendingMigrations) {
        await this.dataSource.runMigrations();
        this.logger.log('Database migrations completed');
      } else {
        this.logger.log('No pending migrations found');
      }
    } catch (error) {
      this.logger.error('Migration failed:', error);
      throw error;
    }
  }

  private async runSeeds(): Promise<void> {
    try {
      this.logger.log('Running database seeds...');
      await this.seedService.runSeeds();
      this.logger.log('Database seeds completed');
    } catch (error) {
      this.logger.error('Seeding failed:', error);
      // Don't throw here - seeds failing shouldn't crash the app
      this.logger.warn('Application will continue without seeds');
    }
  }
}
