import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, ValidateNested, IsUUID } from "class-validator";
import { SendMessageDto } from "./send-message.dto";

export class BatchSendDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SendMessageDto)
  items!: SendMessageDto[];

  @IsOptional()
  @IsUUID()
  phone_id?: string;
}
