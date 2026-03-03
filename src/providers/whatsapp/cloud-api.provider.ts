import { Injectable } from "@nestjs/common";
import axios from "axios";
import { ConfigService } from "@nestjs/config";
import {
  WhatsAppProvider,
  SendTextInput,
  SendMediaInput,
  SendTemplateInput,
  HealthCheckInput
} from "./whatsapp.provider.interface";

@Injectable()
export class WhatsAppCloudApiProvider implements WhatsAppProvider {
  constructor(private readonly config: ConfigService) {}

  private buildUrl(phoneId: string) {
    const version = this.config.get<string>("CLOUD_API_VERSION", "v20.0");
    return `https://graph.facebook.com/${version}/${phoneId}/messages`;
  }

  async sendText(input: SendTextInput) {
    const url = this.buildUrl(input.phoneId);
    const payload = {
      messaging_product: "whatsapp",
      to: input.to,
      type: "text",
      text: { body: input.message }
    };
    const response = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${input.accessToken}` }
    });
    return { providerMessageId: response.data?.messages?.[0]?.id ?? "", response: response.data };
  }

  async sendMedia(input: SendMediaInput) {
    const url = this.buildUrl(input.phoneId);
    const payload = {
      messaging_product: "whatsapp",
      to: input.to,
      type: "image",
      image: { link: input.mediaUrl }
    };
    const response = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${input.accessToken}` }
    });
    return { providerMessageId: response.data?.messages?.[0]?.id ?? "", response: response.data };
  }

  async sendTemplate(input: SendTemplateInput) {
    const url = this.buildUrl(input.phoneId);
    const payload = {
      messaging_product: "whatsapp",
      to: input.to,
      type: "template",
      template: {
        name: input.templateName,
        language: { code: input.templateLang },
        components: []
      }
    };
    const response = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${input.accessToken}` }
    });
    return { providerMessageId: response.data?.messages?.[0]?.id ?? "", response: response.data };
  }

  async healthCheck(input: HealthCheckInput) {
    try {
      const url = this.buildUrl(input.phoneId);
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${input.accessToken}` }
      });
      return { ok: response.status >= 200 && response.status < 300, details: response.data };
    } catch (error: any) {
      return { ok: false, details: error?.response?.data ?? error?.message };
    }
  }
}
