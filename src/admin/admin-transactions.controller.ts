import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { IsIn, IsOptional, IsString } from "class-validator";
import { PrismaService } from "../common/prisma.service";
import { AdminGuard, AdminActor } from "../common/admin.guard";
import { AuditLogService } from "./audit-log.service";

class TransactionActionDto {
  @IsIn(["clear_flag", "reverse"])
  action: "clear_flag" | "reverse";
}

class AnnotateDto {
  @IsString()
  note: string;
}

@Controller("admin/transactions")
@UseGuards(AdminGuard)
export class AdminTransactionsController {
  constructor(private prisma: PrismaService, private auditLog: AuditLogService) {}

  @Get()
  async list(@Query("flagged") flagged?: string) {
    return this.prisma.transaction.findMany({
      where: flagged === "true" ? { flagged: true } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    return this.prisma.transaction.findUniqueOrThrow({ where: { id } });
  }

  @Patch(":id")
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: TransactionActionDto,
    @AdminActor() actor: string
  ) {
    const data =
      dto.action === "clear_flag"
        ? { flagged: false, status: "COMPLETED" as const }
        : { status: "REVERSED" as const };

    const txn = await this.prisma.transaction.update({ where: { id }, data });
    await this.auditLog.log(
      actor,
      dto.action === "clear_flag" ? "Cleared transaction flag" : "Reversed transaction",
      txn.id
    );
    return txn;
  }

  @Post(":id/annotate")
  async annotate(@Param("id") id: string, @Body() dto: AnnotateDto, @AdminActor() actor: string) {
    // Simplification: annotations are recorded as audit log entries rather
    // than a dedicated annotations table — sufficient for an internal note
    // trail, though a real implementation might want them queryable
    // per-transaction rather than only via the global audit log.
    await this.auditLog.log(actor, "Added annotation", `${id}: ${dto.note}`);
    return { saved: true };
  }
}
