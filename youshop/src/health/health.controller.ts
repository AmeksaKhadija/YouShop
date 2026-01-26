import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check() {
    const healthcheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: 'ok',
      },
    };

    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      healthcheck.checks.database = 'ok';
    } catch (error) {
      healthcheck.status = 'error';
      healthcheck.checks.database = 'error';
    }

    return healthcheck;
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  async ready() {
    return { status: 'ready', timestamp: new Date().toISOString() };
  }

  @Get('live')
  @Public()
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  live() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }
}
