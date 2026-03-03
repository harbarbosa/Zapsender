import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { RequestWithTenant } from "../../common/auth/request-with-tenant";
import { BatchSendDto } from "./dto/batch-send.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { MessagesService } from "./messages.service";

@Controller("/api/messages")
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post("/send")
  async send(@Req() req: RequestWithTenant, @Body() dto: SendMessageDto) {
    const message = await this.messagesService.enqueueMessage(req.tenant.id, dto);
    return { message_id: message.id, status: message.status };
  }

  @Post("/batch")
  async batch(@Req() req: RequestWithTenant, @Body() dto: BatchSendDto) {
    const ids = await this.messagesService.enqueueBatch(req.tenant.id, dto.items, dto.phone_id);
    return { queued: ids.length, message_ids: ids };
  }

  @Get(":id")
  async get(@Req() req: RequestWithTenant, @Param("id") id: string) {
    const result = await this.messagesService.getById(req.tenant.id, id);
    return {
      id: result.message.id,
      status: result.message.status,
      to: result.message.to,
      type: result.message.type,
      attempts: result.message.attempts,
      provider_message_id: result.message.providerMessageId,
      error_message: result.message.errorMessage,
      created_at: result.message.createdAt,
      sent_at: result.message.sentAt,
      last_attempts: result.attempts.map((a) => ({
        attempt_number: a.attemptNumber,
        success: a.success,
        http_status: a.httpStatus,
        created_at: a.createdAt
      }))
    };
  }
}
