import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CryptoModule } from "../common/crypto/crypto.module";
import { WhatsAppCloudApiProvider } from "./whatsapp/cloud-api.provider";
import { WhatsAppProviderService } from "./whatsapp/whatsapp-provider.service";

@Module({
  imports: [ConfigModule, CryptoModule],
  providers: [WhatsAppCloudApiProvider, WhatsAppProviderService],
  exports: [WhatsAppProviderService]
})
export class ProvidersModule {}
