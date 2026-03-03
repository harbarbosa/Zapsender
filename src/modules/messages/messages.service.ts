import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { QueueService } from "../queue/queue.service";
import { SendMessageDto } from "./dto/send-message.dto";

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService, private readonly queue: QueueService) {}

  private resolveType(dto: SendMessageDto) {
    if (dto.template_name) return "template" as const;
    if (dto.media_url) return "media" as const;
    return "text" as const;
  }

  private async resolvePhoneId(tenantId: string, phoneId?: string) {
    if (phoneId) {
      const phone = await this.prisma.tenantPhone.findFirst({
        where: { id: phoneId, tenantId, isActive: true }
      });
      if (!phone) throw new BadRequestException("Invalid phone_id");
      return phone.id;
    }

    const phone = await this.prisma.tenantPhone.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: "asc" }
    });

    if (!phone) throw new BadRequestException("No active phone available");
    return phone.id;
  }

  private parseScheduledAt(value?: string) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new BadRequestException("Invalid scheduled_at");
    return date;
  }

  async enqueueMessage(tenantId: string, dto: SendMessageDto) {
    const type = this.resolveType(dto);
    if (type === "text" && !dto.message) throw new BadRequestException("message is required for text");
    if (type === "template" && !dto.template_name) throw new BadRequestException("template_name is required");
    if (type === "media" && !dto.media_url) throw new BadRequestException("media_url is required");

    const tenantPhoneId = await this.resolvePhoneId(tenantId, dto.phone_id);
    const scheduledAt = this.parseScheduledAt(dto.scheduled_at ?? undefined);
    const message = await this.prisma.message.create({
      data: {
        tenantId,
        tenantPhoneId,
        to: dto.to,
        type,
        message: dto.message,
        mediaUrl: dto.media_url,
        templateName: dto.template_name,
        templateLang: dto.template_lang ?? "pt_BR",
        status: "queued",
        scheduledAt
      }
    });

    const delayMs = scheduledAt ? Math.max(0, scheduledAt.getTime() - Date.now()) : 0;
    await this.queue.enqueueMessage(message.id, tenantId, delayMs, message.maxAttempts);

    return message;
  }

  async enqueueBatch(tenantId: string, items: SendMessageDto[], phoneId?: string) {
    const messageIds: string[] = [];

    for (const item of items) {
      const payload = { ...item, phone_id: item.phone_id ?? phoneId } as SendMessageDto;
      const msg = await this.enqueueMessage(tenantId, payload);
      messageIds.push(msg.id);
    }

    return messageIds;
  }

  async getById(tenantId: string, id: string) {
    const message = await this.prisma.message.findFirst({ where: { id, tenantId } });
    if (!message) throw new NotFoundException("Message not found");

    const attempts = await this.prisma.messageAttempt.findMany({
      where: { tenantId, messageId: id },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    return { message, attempts };
  }
}
