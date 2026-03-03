import { Injectable, NotImplementedException } from "@nestjs/common";
import { TenantPhone, TenantPhoneProvider } from "@prisma/client";
import { CryptoService } from "../../common/crypto/crypto.service";
import { WhatsAppCloudApiProvider } from "./cloud-api.provider";
import { WhatsAppProvider } from "./whatsapp.provider.interface";

@Injectable()
export class WhatsAppProviderService {
  constructor(
    private readonly cloudProvider: WhatsAppCloudApiProvider,
    private readonly crypto: CryptoService
  ) {}

  getProvider(phone: TenantPhone): WhatsAppProvider {
    switch (phone.provider) {
      case TenantPhoneProvider.cloud_api:
        return this.cloudProvider;
      case TenantPhoneProvider.dialog360:
      case TenantPhoneProvider.zapi:
      case TenantPhoneProvider.chatpro:
        throw new NotImplementedException("Provider not implemented yet");
      default:
        throw new NotImplementedException("Unknown provider");
    }
  }

  decryptToken(enc: string) {
    return this.crypto.decrypt(enc);
  }
}
