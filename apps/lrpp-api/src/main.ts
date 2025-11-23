import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  app.getHttpAdapter().get('/', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'lrpp-api',
      timestamp: new Date().toISOString(),
    });
  });

  const port = process.env.API_PORT || 3001;
  await app.listen(port);

  console.log(`🚀 LRPP API running on http://localhost:${port}`);
}

bootstrap();
