import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>("REDIS_HOST", "localhost");
    const port = Number(this.config.get<string>("REDIS_PORT", "6379"));
    this.client = new Redis({ host, port, maxRetriesPerRequest: null });
  }

  getClient() {
    return this.client;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
