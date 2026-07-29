import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./common/prisma.module";
import { CoreAuthModule } from "./auth/core-auth.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { WalletModule } from "./wallet/wallet.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { KycModule } from "./kyc/kyc.module";
import { AdminModule } from "./admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CoreAuthModule,
    AuthModule,
    UsersModule,
    WalletModule,
    TransactionsModule,
    KycModule,
    AdminModule,
  ],
})
export class AppModule {}
