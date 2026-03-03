import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import { QueueService } from "./queue.service";
import { WHATSAPP_QUEUE } from "./queue.constants";

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: WHATSAPP_QUEUE,
      useFactory: (config: ConfigService) => {
        const host = config.get<string>("REDIS_HOST", "localhost");
        const port = Number(config.get<string>("REDIS_PORT", "6379"));
        const defaultBackoff = Number(config.get<string>("DEFAULT_BACKOFF_MS", "1000"));
        return new Queue(WHATSAPP_QUEUE, {
          connection: { host, port },
          defaultJobOptions: {
            removeOnComplete: 1000,
            removeOnFail: 1000,
            backoff: { type: "exponential", delay: defaultBackoff }
          }
        });
      },
      inject: [ConfigService]
    },
    QueueService
  ],
  exports: [QueueService, WHATSAPP_QUEUE]
})
export class QueueModule {}
