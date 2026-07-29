import { Module } from "@nestjs/common";
import { AuditLogService } from "./audit-log.service";
import { AdminOverviewController } from "./admin-overview.controller";
import { AdminUsersController } from "./admin-users.controller";
import { AdminTransactionsController } from "./admin-transactions.controller";
import { AdminTicketsController } from "./admin-tickets.controller";
import { AdminBillersController } from "./admin-billers.controller";
import { AdminPerksController } from "./admin-perks.controller";
import { AdminRolesController } from "./admin-roles.controller";
import { AdminAuditLogController } from "./admin-audit-log.controller";
import { WalletModule } from "../wallet/wallet.module";

@Module({
  imports: [WalletModule],
  providers: [AuditLogService],
  controllers: [
    AdminOverviewController,
    AdminUsersController,
    AdminTransactionsController,
    AdminTicketsController,
    AdminBillersController,
    AdminPerksController,
    AdminRolesController,
    AdminAuditLogController,
  ],
  exports: [AuditLogService],
})
export class AdminModule {}
