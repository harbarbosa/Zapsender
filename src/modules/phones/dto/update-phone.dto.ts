import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { TenantPhoneProvider } from "@prisma/client";

export class UpdatePhoneDto {
  @IsOptional()
  @IsEnum(TenantPhoneProvider)
  provider?: TenantPhoneProvider;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  display_name?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
  phone_id?: string;

  @IsOptional()
  @IsString()
  business_account_id?: string;

  @IsOptional()
  @IsString()
  access_token?: string;

  @IsOptional()
  @IsString()
  webhook_verify_token?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
