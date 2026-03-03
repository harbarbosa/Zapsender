import { Controller, Get, Post, Req } from "@nestjs/common";
import { RequestWithTenant } from "../../common/auth/request-with-tenant";
import { TenantsService } from "./tenants.service";

@Controller("/api/tenants")
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get("/me")
  async me(@Req() req: RequestWithTenant) {
    const tenant = await this.tenantsService.getById(req.tenant.id);
    return {
      id: tenant.id,
      name: tenant.name,
      is_active: tenant.isActive,
      rate_limit_per_minute: tenant.rateLimitPerMinute,
      created_at: tenant.createdAt
    };
  }

  @Post("/api-key")
  async rotateKey(@Req() req: RequestWithTenant) {
    const result = await this.tenantsService.rotateApiKey(req.tenant.id);
    return { api_key: result.apiKey };
  }
}
