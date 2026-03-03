import { IsOptional, IsString, Matches, MaxLength, IsUrl, IsUUID } from "class-validator";

export class SendMessageDto {
  @Matches(/^\d{10,15}$/)
  to!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  message?: string;

  @IsOptional()
  @IsUrl()
  media_url?: string;

  @IsOptional()
  @IsString()
  template_name?: string;

  @IsOptional()
  @IsString()
  template_lang?: string;

  @IsOptional()
  @IsUUID()
  phone_id?: string;

  @IsOptional()
  @IsString()
  scheduled_at?: string;
}
