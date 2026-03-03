import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import { RedisService } from "../../common/redis.service";
import { QueueService } from "./queue.service";
import { WHATSAPP_QUEUE } from "./queue.constants";

@Module({
  imports: [ConfigModule],
  providers: [
    RedisService,
    {
      provide: WHATSAPP_QUEUE,
      useFactory: (config: ConfigService, redis: RedisService) => {
        const connection = redis.getClient();
        const defaultBackoff = Number(config.get<string>("DEFAULT_BACKOFF_MS", "1000"));
        return new Queue(WHATSAPP_QUEUE, {
          connection,
          defaultJobOptions: {
            removeOnComplete: 1000,
            removeOnFail: 1000,
            backoff: { type: "exponential", delay: defaultBackoff }
          }
        });
      },
      inject: [ConfigService, RedisService]
    },
    QueueService
  ],
  exports: [QueueService, WHATSAPP_QUEUE, RedisService]
})
export class QueueModule {}
