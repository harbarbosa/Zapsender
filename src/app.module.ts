import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./common/prisma.module";
import { RedisModule } from "./common/redis.module";
import { AuthModule } from "./modules/auth/auth.module";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { PhonesModule } from "./modules/phones/phones.module";
import { MessagesModule } from "./modules/messages/messages.module";
import { QueueModule } from "./modules/queue/queue.module";
import { ApiKeyGuard } from "./common/guards/api-key.guard";
import { RateLimitGuard } from "./common/guards/rate-limit.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    TenantsModule,
    PhonesModule,
    MessagesModule,
    QueueModule
  ],
  providers: [{ provide: APP_GUARD, useClass: ApiKeyGuard }, { provide: APP_GUARD, useClass: RateLimitGuard }]
})
export class AppModule {}
