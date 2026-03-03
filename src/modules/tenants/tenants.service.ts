import { Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../../common/prisma.service";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService, private readonly auth: AuthService) {}

  async getById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException("Tenant not found");
    return tenant;
  }

  async rotateApiKey(tenantId: string) {
    const apiKey = randomBytes(24).toString("base64url");
    const hash = await this.auth.hashApiKey(apiKey);
    await this.prisma.tenant.update({ where: { id: tenantId }, data: { apiKeyHash: hash } });
    return { apiKey };
  }
}
