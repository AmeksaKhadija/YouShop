import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('YouShop E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let adminToken: string;
  let categoryId: string;
  let productId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // Clean database before tests
    if (process.env.NODE_ENV !== 'production') {
      await prisma.cleanDatabase();
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Module', () => {
    const clientUser = {
      email: 'client@example.com',
      password: 'SecureP@ss123',
      firstName: 'John',
      lastName: 'Doe',
    };

    describe('POST /api/v1/auth/register', () => {
      it('should register a new user', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send(clientUser)
          .expect(201);

        expect(response.body.data).toHaveProperty('accessToken');
        expect(response.body.data.user).toHaveProperty('email', clientUser.email);
        expect(response.body.data.user).toHaveProperty('role', 'CLIENT');
        authToken = response.body.data.accessToken;
      });

      it('should reject duplicate email', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send(clientUser)
          .expect(409);
      });

      it('should reject weak password', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({ ...clientUser, email: 'weak@example.com', password: '123' })
          .expect(400);
      });
    });

    describe('POST /api/v1/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: clientUser.email,
            password: clientUser.password,
          })
          .expect(200);

        expect(response.body.data).toHaveProperty('accessToken');
        authToken = response.body.data.accessToken;
      });

      it('should reject invalid credentials', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: clientUser.email,
            password: 'wrongpassword',
          })
          .expect(401);
      });
    });

    describe('GET /api/v1/auth/profile', () => {
      it('should return user profile when authenticated', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('email', clientUser.email);
      });

      it('should reject unauthenticated request', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/auth/profile')
          .expect(401);
      });
    });
  });

  describe('Catalog Module (Public)', () => {
    beforeAll(async () => {
      // Create admin user directly in database for testing
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash('AdminP@ss123', 10);

      await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
        },
      });

      const adminResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'AdminP@ss123',
        });

      adminToken = adminResponse.body.data.accessToken;
    });

    describe('Categories', () => {
      describe('POST /api/v1/catalog/categories (Admin)', () => {
        it('should create a category as admin', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/v1/catalog/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Electronics',
              description: 'Electronic devices and gadgets',
            })
            .expect(201);

          expect(response.body.data).toHaveProperty('name', 'Electronics');
          categoryId = response.body.data.id;
        });

        it('should reject non-admin', async () => {
          await request(app.getHttpServer())
            .post('/api/v1/catalog/categories')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              name: 'Books',
            })
            .expect(403);
        });
      });

      describe('GET /api/v1/catalog/categories (Public)', () => {
        it('should list categories without authentication', async () => {
          const response = await request(app.getHttpServer())
            .get('/api/v1/catalog/categories')
            .expect(200);

          expect(response.body.data).toBeInstanceOf(Array);
          expect(response.body.data.length).toBeGreaterThan(0);
        });
      });
    });

    describe('Products', () => {
      describe('POST /api/v1/catalog/products (Admin)', () => {
        it('should create a product as admin', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/v1/catalog/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'iPhone 15 Pro',
              description: 'Latest Apple smartphone',
              price: 999.99,
              categoryId: categoryId,
              sku: 'IPHONE-15-PRO',
              initialStock: 100,
            })
            .expect(201);

          expect(response.body.data).toHaveProperty('name', 'iPhone 15 Pro');
          expect(response.body.data.inventory).toHaveProperty('quantity', 100);
          productId = response.body.data.id;
        });
      });

      describe('GET /api/v1/catalog/products (Public)', () => {
        it('should list products without authentication', async () => {
          const response = await request(app.getHttpServer())
            .get('/api/v1/catalog/products')
            .expect(200);

          expect(response.body.data).toBeInstanceOf(Array);
          expect(response.body.meta).toHaveProperty('total');
        });

        it('should filter by category', async () => {
          const response = await request(app.getHttpServer())
            .get(`/api/v1/catalog/products?categoryId=${categoryId}`)
            .expect(200);

          expect(response.body.data).toBeInstanceOf(Array);
        });

        it('should paginate results', async () => {
          const response = await request(app.getHttpServer())
            .get('/api/v1/catalog/products?page=1&limit=5')
            .expect(200);

          expect(response.body.meta).toHaveProperty('page', 1);
          expect(response.body.meta).toHaveProperty('limit', 5);
        });
      });

      describe('GET /api/v1/catalog/products/:id (Public)', () => {
        it('should return product details', async () => {
          const response = await request(app.getHttpServer())
            .get(`/api/v1/catalog/products/${productId}`)
            .expect(200);

          expect(response.body.data).toHaveProperty('name', 'iPhone 15 Pro');
          expect(response.body.data).toHaveProperty('availableStock');
        });
      });
    });
  });

  describe('Orders Module', () => {
    let orderId: string;

    describe('POST /api/v1/orders', () => {
      it('should create an order', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/orders')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            items: [
              { productId: productId, quantity: 2 },
            ],
          })
          .expect(201);

        expect(response.body.data).toHaveProperty('orderNumber');
        expect(response.body.data).toHaveProperty('status', 'PENDING');
        expect(response.body.data.totalAmount).toBeGreaterThan(0);
        orderId = response.body.data.id;
      });

      it('should reject order without authentication', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/orders')
          .send({
            items: [{ productId: productId, quantity: 1 }],
          })
          .expect(401);
      });
    });

    describe('GET /api/v1/orders/my-orders', () => {
      it('should list user orders', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/orders/my-orders')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });

    describe('PATCH /api/v1/orders/:id/status (Admin)', () => {
      it('should update order status to PAID', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/api/v1/orders/${orderId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'PAID' })
          .expect(200);

        expect(response.body.data).toHaveProperty('status', 'PAID');
      });
    });
  });

  describe('Inventory Module (Admin)', () => {
    describe('GET /api/v1/inventory/sku/:sku', () => {
      it('should return inventory by SKU', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/inventory/sku/IPHONE-15-PRO')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('sku', 'IPHONE-15-PRO');
        expect(response.body.data).toHaveProperty('availableStock');
      });

      it('should reject non-admin', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/inventory/sku/IPHONE-15-PRO')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });
    });

    describe('PATCH /api/v1/inventory/sku/:sku/adjust', () => {
      it('should adjust stock quantity', async () => {
        const response = await request(app.getHttpServer())
          .patch('/api/v1/inventory/sku/IPHONE-15-PRO/adjust')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ adjustment: 50, reason: 'Stock replenishment' })
          .expect(200);

        expect(response.body.data.quantity).toBeGreaterThan(100);
      });
    });
  });
});
