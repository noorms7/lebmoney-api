import { Module } from "@nestjs/common";
import { TransactionsService } from "./transactions.service";
import { TransactionsController } from "./transactions.controller";
import { WalletModule } from "../wallet/wallet.module";

@Module({
  imports: [WalletModule],
  providers: [TransactionsService],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
