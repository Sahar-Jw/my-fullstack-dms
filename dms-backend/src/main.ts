import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import * as path from 'path';
import { I18nValidationExceptionFilter } from 'nestjs-i18n';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create upload directories
  const uploadRoot = process.env.FILE_UPLOAD_PATH || './uploads';
  const subDirs = ['documents', 'attachments', 'profile-pictures'];
  subDirs.forEach((sub) => {
    const dir = path.join(uploadRoot, sub);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.log(`Created directory: ${dir}`);
    }
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.setGlobalPrefix('api');

  // ✅ THIS IS CRITICAL - Serve static files from uploads folder
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // I18nValidationExceptionFilter only catches validation-pipe errors and
  // translates their messages; HttpExceptionFilter still handles everything
  // else exactly as before. Registration order doesn't matter here since
  // the two filters target different exception types.
  app.useGlobalFilters(new HttpExceptionFilter(), new I18nValidationExceptionFilter());
  app.enableCors();

  const port = process.env.PORT || 5000;
  await app.listen(port);
  logger.log(`🚀 Application running on: http://localhost:${port}`);
  logger.log(`📁 Uploads served from: /uploads/`);
}

bootstrap();