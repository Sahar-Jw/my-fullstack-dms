import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger, ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/exceptions.filter';
import * as fs from 'fs';
import * as path from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Ensure upload directories exist
  const uploadRoot = process.env.FILE_UPLOAD_PATH || './uploads';
  ['documents', 'attachments'].forEach((sub) => {
    const dir = path.join(uploadRoot, sub);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  app.enableCors();

  // 2. بناء إعدادات لوحة تحكم Swagger
  const config = new DocumentBuilder()
    .setTitle('Document Management System (DMS) API') // عنوان المشروع
    .setDescription('The core backend API documentation for DMS') // وصف المشروع
    .setVersion('1.0') // إصدار الـ API
    .addBearerAuth() // إتاحة خيار إدخال الـ JWT Token للتجربة
    .build();

  // 3. إنشاء مستند الـ API وتربيطه مع المشروع
  const document = SwaggerModule.createDocument(app, config);
  
  //http://localhost:5000/swagger
  SwaggerModule.setup('swagger', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`DMS backend running on http://localhost:${port}/api`);
}
bootstrap();
