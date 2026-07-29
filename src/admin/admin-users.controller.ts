import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { IsIn } from "class-validator";
import { PrismaService } from "../common/prisma.service";
import { AdminGuard, AdminActor } from "../common/admin.guard";
import { AuditLogService } from "./audit-log.service";
import { WalletService } from "../wallet/wallet.service";
import { UserStatus, USER_STATUSES } from "../common/enums";

class UpdateUserStatusDto {
  @IsIn(USER_STATUSES)
  status: UserStatus;
}

@Controller("admin/users")
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private walletService: WalletService
  ) {}

  @Get()
  async list(@Query("q") q?: string) {
    return this.prisma.user.findMany({
      where: q
        ? { OR: [{ name: { contains: q } }, { handle: { contains: q } }, { phone: { contains: q } }] }
        : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    const balances = await this.walletService.getBalances(id).catch(() => []);
    return { ...user, balances };
  }

  @Patch(":id/status")
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateUserStatusDto,
    @AdminActor() actor: string
  ) {
    const user = await this.prisma.user.update({ where: { id }, data: { status: dto.status } });
    await this.auditLog.log(actor, `Set user status to ${dto.status}`, user.handle);
    return user;
  }
}
