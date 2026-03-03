import { Inject, Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { WHATSAPP_QUEUE } from "./queue.constants";

@Injectable()
export class QueueService {
  constructor(@Inject(WHATSAPP_QUEUE) private readonly queue: Queue) {}

  async enqueueMessage(messageId: string, tenantId: string, delayMs: number, attempts: number) {
    await this.queue.add(
      "send",
      { messageId, tenantId },
      {
        attempts,
        delay: delayMs > 0 ? delayMs : 0
      }
    );
  }
}
