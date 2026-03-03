import { Injectable, Logger } from "@nestjs/common";
import { Job, Worker } from "bullmq";
import { PrismaService } from "./common/prisma.service";
import { RedisService } from "./common/redis.service";
import { WHATSAPP_QUEUE } from "./modules/queue/queue.constants";
import { WhatsAppProviderService } from "./providers/whatsapp/whatsapp-provider.service";

@Injectable()
export class WorkerService {
  private readonly logger = new Logger("WorkerService");
  private worker?: Worker;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly providers: WhatsAppProviderService
  ) {}

  async start() {
    const connection = this.redis.getClient();
    this.worker = new Worker(
      WHATSAPP_QUEUE,
      async (job) => this.process(job),
      {
        connection,
        concurrency: 5
      }
    );

    this.worker.on("failed", (job, err) => {
      this.logger.error(`Job failed ${job?.id}: ${err?.message}`);
    });

    this.worker.on("completed", (job) => {
      this.logger.log(`Job completed ${job.id}`);
    });
  }

  private async process(job: Job) {
    const { messageId, tenantId } = job.data as { messageId: string; tenantId: string };

    const message = await this.prisma.message.findFirst({ where: { id: messageId, tenantId } });
    if (!message) return;

    if (message.status === "sent" || message.status === "failed") return;

    let tenantPhoneId = message.tenantPhoneId;
    if (!tenantPhoneId) {
      const phone = await this.prisma.tenantPhone.findFirst({
        where: { tenantId, isActive: true },
        orderBy: { createdAt: "asc" }
      });
      if (!phone) throw new Error("No active phone available");
      tenantPhoneId = phone.id;
      await this.prisma.message.update({ where: { id: message.id }, data: { tenantPhoneId } });
    }

    const phone = await this.prisma.tenantPhone.findFirst({ where: { id: tenantPhoneId, tenantId, isActive: true } });
    if (!phone) {
      await this.prisma.message.update({
        where: { id: message.id },
        data: { status: "failed", errorMessage: "Inactive phone" }
      });
      return;
    }
    if (!phone.phoneId) {
      await this.prisma.message.update({
        where: { id: message.id },
        data: { status: "failed", errorMessage: "phone_id is required for provider" }
      });
      return;
    }

    const canProceed = await this.acquirePhoneSlot(phone.id);
    if (!canProceed) {
      await job.moveToDelayed(Date.now() + 1000);
      return;
    }

    const updated = await this.prisma.message.update({
      where: { id: message.id },
      data: { status: "sending", attempts: { increment: 1 } }
    });

    const attemptNumber = updated.attempts;
    const accessToken = this.providers.decryptToken(phone.accessTokenEnc);
    const provider = this.providers.getProvider(phone);

    const requestPayload = {
      to: message.to,
      type: message.type,
      message: message.message,
      media_url: message.mediaUrl,
      template_name: message.templateName,
      template_lang: message.templateLang,
      phone_id: phone.phoneId,
      access_token: "***masked***"
    };

    try {
      let response: any = null;
      let providerMessageId = "";

      if (message.type === "text") {
        const result = await provider.sendText({
          to: message.to,
          message: message.message ?? "",
          phoneId: phone.phoneId ?? "",
          accessToken
        });
        response = result.response;
        providerMessageId = result.providerMessageId;
      } else if (message.type === "media") {
        const result = await provider.sendMedia({
          to: message.to,
          mediaUrl: message.mediaUrl ?? "",
          phoneId: phone.phoneId ?? "",
          accessToken
        });
        response = result.response;
        providerMessageId = result.providerMessageId;
      } else {
        const result = await provider.sendTemplate({
          to: message.to,
          templateName: message.templateName ?? "",
          templateLang: message.templateLang,
          phoneId: phone.phoneId ?? "",
          accessToken
        });
        response = result.response;
        providerMessageId = result.providerMessageId;
      }

      await this.prisma.messageAttempt.create({
        data: {
          tenantId,
          messageId: message.id,
          attemptNumber,
          requestPayload,
          responsePayload: response ?? {},
          httpStatus: 200,
          success: true
        }
      });

      await this.prisma.message.update({
        where: { id: message.id },
        data: {
          status: "sent",
          sentAt: new Date(),
          providerMessageId,
          errorMessage: null,
          errorCode: null
        }
      });
    } catch (error: any) {
      const httpStatus = error?.response?.status ?? null;
      const responsePayload = error?.response?.data ?? { message: error?.message };
      const errorCode = error?.response?.data?.error?.code?.toString?.() ?? null;

      await this.prisma.messageAttempt.create({
        data: {
          tenantId,
          messageId: message.id,
          attemptNumber,
          requestPayload,
          responsePayload,
          httpStatus,
          success: false,
          errorMessage: error?.message
        }
      });

      const maxAttempts = job.opts.attempts ?? updated.maxAttempts;
      const isLastAttempt = job.attemptsMade + 1 >= maxAttempts;

      await this.prisma.message.update({
        where: { id: message.id },
        data: {
          status: isLastAttempt ? "failed" : "queued",
          errorMessage: error?.message,
          errorCode: errorCode
        }
      });

      if (!isLastAttempt) throw error;
    }
  }

  private async acquirePhoneSlot(tenantPhoneId: string) {
    const client = this.redis.getClient();
    const key = `rate:phone:${tenantPhoneId}`;
    const result = await client.set(key, "1", "PX", 1000, "NX");
    return result === "OK";
  }
}
