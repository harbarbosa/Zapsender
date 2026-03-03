import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./common/prisma.module";
import { QueueModule } from "./modules/queue/queue.module";
import { WorkerService } from "./worker.service";
import { ProvidersModule } from "./providers/providers.module";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, QueueModule, ProvidersModule],
  providers: [WorkerService]
})
export class WorkerModule {}
