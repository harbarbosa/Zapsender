import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../../modules/auth/auth.service";
import { RequestWithTenant } from "../auth/request-with-tenant";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const apiKey = request.headers["x-api-key"] as string | undefined;

    if (!apiKey) throw new UnauthorizedException("Missing x-api-key");

    const tenant = await this.authService.validateApiKey(apiKey);
    if (!tenant) throw new UnauthorizedException("Invalid API key");

    request.tenant = tenant;
    return true;
  }
}
