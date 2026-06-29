// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module'; // Make sure this path is correct
// import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   // Swagger setup
//   const config = new DocumentBuilder()
//     .setTitle('NestJS API')
//     .setDescription('API documentation for the application')
//     .setVersion('1.0')
//     .addBearerAuth() // Add authentication type if needed
//     .build();
//   const document = SwaggerModule.createDocument(app, config);
//   SwaggerModule.setup('api', app, document);

//   await app.listen(3000);
// }

// bootstrap();


import 'dotenv/config'; // load .env BEFORE any module is imported (so secret checks see it)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global exception filter — consistent error JSON + no stack leak in prod.
  app.useGlobalFilters(new AllExceptionsFilter());

  // Security headers (CSP, HSTS, X-Frame-Options, etc.) against clickjacking/MIME/XSS.
  app.use(helmet());

  // CORS — pass an options OBJECT (the old array form did NOT restrict origins).
  // Origins come from CORS_ORIGINS env (comma-separated) or default to the dev frontends.
  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({ origin: corsOrigins, credentials: true });

  // Enable validation globally for DTOs.
  // whitelist  → strips properties not declared/decorated in the DTO (kills mass-assignment).
  // transform  → coerces payloads to the DTO type, so e.g. a {$ne:null} object on a @IsString
  //              field is rejected (kills NoSQL operator injection on validated routes).
  // forbidNonWhitelisted left false for now (some routes still use untyped `any` bodies);
  // turn on once all DTOs are complete.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('NestJS API')
    .setDescription('API documentation for the application')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'JWT-auth', // You can reference this in Swagger decorators if needed
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3001);
}

bootstrap();
