import { NestFactory } from '@nestjs/core';
import "reflect-metadata";

import { AppModule } from './app.module';
import { EventsAdapter } from './EventsAdapter';

async function bootstrap() {
  const appOptions = { cors: true };
  const app = await NestFactory.create(AppModule, appOptions);
  app.useWebSocketAdapter(new EventsAdapter(app));
  app.setGlobalPrefix('api');

  await app.listen(3000);
}
bootstrap();
