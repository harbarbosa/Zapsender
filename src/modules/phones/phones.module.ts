import { Module } from "@nestjs/common";
import { CryptoModule } from "../../common/crypto/crypto.module";
import { ProvidersModule } from "../../providers/providers.module";
import { PhonesController } from "./phones.controller";
import { PhonesService } from "./phones.service";

@Module({
  imports: [CryptoModule, ProvidersModule],
  controllers: [PhonesController],
  providers: [PhonesService]
})
export class PhonesModule {}
