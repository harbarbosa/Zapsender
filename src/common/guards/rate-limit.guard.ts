import { CanActivate, ExecutionContext, Injectable, TooManyRequestsException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../redis.service";
import { RequestWithTenant } from "../auth/request-with-tenant";

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly redis: RedisService, private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const tenant = request.tenant;
    if (!tenant) return true;

    const windowSec = Number(this.config.get<string>("RATE_LIMIT_WINDOW_SEC", "60"));
    const limit = tenant.rateLimitPerMinute || Number(this.config.get<string>("DEFAULT_RATE_LIMIT_PER_MINUTE", "60"));
    const windowBucket = Math.floor(Date.now() / (windowSec * 1000));
    const key = `rate:tenant:${tenant.id}:${windowBucket}`;
    const client = this.redis.getClient();

    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, windowSec);
    }

    if (count > limit) {
      throw new TooManyRequestsException("Rate limit exceeded");
    }

    const to = (request as any).body?.to as string | undefined;
    if (to && /^\d{10,15}$/.test(to)) {
      const phoneKey = `rate:tenant:${tenant.id}:to:${to}:${windowBucket}`;
      const phoneCount = await client.incr(phoneKey);
      if (phoneCount === 1) {
        await client.expire(phoneKey, windowSec);
      }
      if (phoneCount > limit) {
        throw new TooManyRequestsException("Rate limit exceeded for phone");
      }
    }

    return true;
  }
}
