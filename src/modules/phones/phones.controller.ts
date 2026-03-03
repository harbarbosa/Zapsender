import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { RequestWithTenant } from "../../common/auth/request-with-tenant";
import { CreatePhoneDto } from "./dto/create-phone.dto";
import { UpdatePhoneDto } from "./dto/update-phone.dto";
import { PhonesService } from "./phones.service";

@Controller("/api/phones")
export class PhonesController {
  constructor(private readonly phonesService: PhonesService) {}

  private sanitize(phone: any) {
    const { accessTokenEnc, webhookVerifyTokenEnc, ...rest } = phone;
    return rest;
  }

  @Post()
  async create(@Req() req: RequestWithTenant, @Body() dto: CreatePhoneDto) {
    const phone = await this.phonesService.create(req.tenant.id, dto);
    return this.sanitize(phone);
  }

  @Get()
  async list(@Req() req: RequestWithTenant) {
    const phones = await this.phonesService.list(req.tenant.id);
    return phones.map((p: any) => this.sanitize(p));
  }

  @Get(":id")
  async get(@Req() req: RequestWithTenant, @Param("id") id: string) {
    const phone = await this.phonesService.getById(req.tenant.id, id);
    return this.sanitize(phone);
  }

  @Patch(":id")
  async update(@Req() req: RequestWithTenant, @Param("id") id: string, @Body() dto: UpdatePhoneDto) {
    const phone = await this.phonesService.update(req.tenant.id, id, dto);
    return this.sanitize(phone);
  }

  @Delete(":id")
  async remove(@Req() req: RequestWithTenant, @Param("id") id: string) {
    await this.phonesService.remove(req.tenant.id, id);
    return { deleted: true };
  }

  @Post(":id/check")
  async check(@Req() req: RequestWithTenant, @Param("id") id: string) {
    return this.phonesService.healthCheck(req.tenant.id, id);
  }
}
