import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { CryptoService } from "../../common/crypto/crypto.service";
import { CreatePhoneDto } from "./dto/create-phone.dto";
import { UpdatePhoneDto } from "./dto/update-phone.dto";
import { WhatsAppProviderService } from "../../providers/whatsapp/whatsapp-provider.service";

@Injectable()
export class PhonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly providers: WhatsAppProviderService
  ) {}

  async create(tenantId: string, dto: CreatePhoneDto) {
    const accessTokenEnc = this.crypto.encrypt(dto.access_token);
    const webhookVerifyTokenEnc = dto.webhook_verify_token
      ? this.crypto.encrypt(dto.webhook_verify_token)
      : null;

    return this.prisma.tenantPhone.create({
      data: {
        tenantId,
        provider: dto.provider,
        displayName: dto.display_name,
        phoneNumber: dto.phone_number,
        phoneId: dto.phone_id,
        businessAccountId: dto.business_account_id,
        accessTokenEnc,
        webhookVerifyTokenEnc
      }
    });
  }

  async list(tenantId: string) {
    return this.prisma.tenantPhone.findMany({ where: { tenantId } });
  }

  async getById(tenantId: string, id: string) {
    const phone = await this.prisma.tenantPhone.findFirst({ where: { id, tenantId } });
    if (!phone) throw new NotFoundException("Phone not found");
    return phone;
  }

  async update(tenantId: string, id: string, dto: UpdatePhoneDto) {
    await this.getById(tenantId, id);
    const data: any = {
      provider: dto.provider,
      displayName: dto.display_name,
      phoneNumber: dto.phone_number,
      phoneId: dto.phone_id,
      businessAccountId: dto.business_account_id,
      isActive: dto.is_active
    };

    if (dto.access_token) data.accessTokenEnc = this.crypto.encrypt(dto.access_token);
    if (dto.webhook_verify_token) data.webhookVerifyTokenEnc = this.crypto.encrypt(dto.webhook_verify_token);

    return this.prisma.tenantPhone.update({ where: { id }, data });
  }

  async remove(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    await this.prisma.tenantPhone.delete({ where: { id } });
  }

  async healthCheck(tenantId: string, id: string) {
    const phone = await this.getById(tenantId, id);
    if (!phone.phoneId) {
      throw new NotFoundException("phone_id is required for health check");
    }
    const provider = this.providers.getProvider(phone);
    const accessToken = this.providers.decryptToken(phone.accessTokenEnc);
    const result = await provider.healthCheck({ phoneId: phone.phoneId ?? "", accessToken });

    await this.prisma.tenantPhone.update({
      where: { id: phone.id },
      data: {
        healthStatus: result.ok ? "ok" : "fail",
        lastHealthCheckAt: new Date()
      }
    });

    return result;
  }
}
