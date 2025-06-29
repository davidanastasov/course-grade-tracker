import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource
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
      if (this.dataSource.isInitialized) {
        await this.dataSource.query('SELECT 1');
        databaseStatus = 'connected';
      }
    } catch (error) {
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
