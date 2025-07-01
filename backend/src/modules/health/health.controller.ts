import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection()
    private connection: Connection
  ) {}

  @Get()
  async getHealthCheck(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    database: string;
    version: string;
  }> {
    let databaseStatus = 'disconnected';

    try {
      // Check database connection
      if (this.connection.readyState === 1) {
        // MongoDB connection check
        await this.connection.db.admin().ping();
        databaseStatus = 'connected';
      }
    } catch {
      databaseStatus = 'error';
    }

    return {
      status: databaseStatus === 'connected' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: databaseStatus,
      version: process.env.npm_package_version || '1.0.0'
    };
  }

  @Get('simple')
  getSimpleHealth(): { status: string; timestamp: string; uptime: number } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime())
    };
  }
}
