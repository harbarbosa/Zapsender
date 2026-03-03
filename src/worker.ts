import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { WorkerModule } from "./worker.module";
import { WorkerService } from "./worker.service";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule, { logger: ["log", "error", "warn"] });
  const worker = app.get(WorkerService);
  await worker.start();
}

bootstrap();
