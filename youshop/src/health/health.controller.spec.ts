import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prismaService: PrismaService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return healthy status when database is connected', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(result.checks.database).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return error status when database is disconnected', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(result.checks.database).toBe('error');
    });
  });

  describe('ready', () => {
    it('should return ready status', async () => {
      const result = await controller.ready();

      expect(result.status).toBe('ready');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('live', () => {
    it('should return alive status', () => {
      const result = controller.live();

      expect(result.status).toBe('alive');
      expect(result.timestamp).toBeDefined();
    });
  });
});
