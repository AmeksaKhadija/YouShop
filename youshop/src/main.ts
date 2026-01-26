import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet());

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('YouShop API')
    .setDescription(
      `
      YouShop E-commerce Backend API

      ## Modules
      - **Auth**: User registration, login, JWT authentication
      - **Catalog**: Products and categories management
      - **Inventory**: Stock management by SKU
      - **Orders**: Order lifecycle management

      ## Authentication
      Use the /auth/login endpoint to get a JWT token, then use it in the Authorization header as "Bearer <token>".

      ## Roles
      - **CLIENT**: Can browse catalog, create orders, view own orders
      - **ADMIN**: Full access to all resources

      ## Payment
      Stripe checkout sessions for secure payment processing.
      Webhooks handle payment confirmations automatically.
    `,
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication endpoints')
    .addTag('Catalog', 'Products and categories')
    .addTag('Inventory', 'Stock management')
    .addTag('Orders', 'Order management')
    .addTag('Payment', 'Stripe payment processing')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Application running on http://localhost:${port}`);
  logger.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
