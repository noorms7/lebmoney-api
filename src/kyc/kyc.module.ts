import { Module } from "@nestjs/common";
import { KycService } from "./kyc.service";
import { KycController } from "./kyc.controller";
import { AdminModule } from "../admin/admin.module";

@Module({
  imports: [AdminModule],
  providers: [KycService],
  controllers: [KycController],
})
export class KycModule {}
