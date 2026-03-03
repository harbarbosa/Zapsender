import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validateApiKey(apiKey: string) {
    const tenants = await this.prisma.tenant.findMany({ where: { isActive: true } });
    for (const tenant of tenants) {
      const match = await bcrypt.compare(apiKey, tenant.apiKeyHash);
      if (match) return tenant;
    }
    return null;
  }

  async hashApiKey(apiKey: string) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(apiKey, salt);
  }
}
