export interface SendTextInput {
  to: string;
  message: string;
  phoneId: string;
  accessToken: string;
}

export interface SendMediaInput {
  to: string;
  mediaUrl: string;
  phoneId: string;
  accessToken: string;
}

export interface SendTemplateInput {
  to: string;
  templateName: string;
  templateLang: string;
  phoneId: string;
  accessToken: string;
}

export interface HealthCheckInput {
  phoneId: string;
  accessToken: string;
}

export interface WhatsAppProvider {
  sendText(input: SendTextInput): Promise<{ providerMessageId: string; response: any }>;
  sendMedia(input: SendMediaInput): Promise<{ providerMessageId: string; response: any }>;
  sendTemplate(input: SendTemplateInput): Promise<{ providerMessageId: string; response: any }>;
  healthCheck(input: HealthCheckInput): Promise<{ ok: boolean; details?: any }>;
}
