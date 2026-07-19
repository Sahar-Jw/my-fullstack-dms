// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { I18nValidationExceptionFilter } from 'nestjs-i18n';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.setGlobalPrefix('api');

  // Files (documents, attachments, profile pictures) now live in Postgres
  // as bytea columns and are served through their own controller routes
  // (e.g. GET /api/documents/:id/download, GET /api/profile/picture).
  // No more static uploads folder to serve.

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ✅ Now this works because HttpExceptionFilter is registered in AppModule
  app.useGlobalFilters(
    app.get(HttpExceptionFilter),
    new I18nValidationExceptionFilter()
  );

  app.enableCors();

  const port = process.env.PORT || 5000;
  await app.listen(port);
  logger.log(`🚀 Application running on: http://localhost:${port}`);
}

bootstrap();
