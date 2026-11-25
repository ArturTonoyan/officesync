import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function start() {
  const PORT = process.env.PORT || 3004;
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const logger = new Logger('Bootstrap');

  // planData этажа — большой JSON; дефолтный лимит 100kb обрезает сохранение
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  app.enableCors();

  await app.listen(PORT);
  logger.log(`Server started on port ${PORT}`);
}

start();
