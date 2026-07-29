import { Module } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { LedgerService } from "./ledger.service";
import { WalletController } from "./wallet.controller";

@Module({
  providers: [WalletService, LedgerService],
  controllers: [WalletController],
  exports: [WalletService, LedgerService],
})
export class WalletModule {}
