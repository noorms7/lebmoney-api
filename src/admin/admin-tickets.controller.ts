import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { IsString } from "class-validator";
import { PrismaService } from "../common/prisma.service";
import { AdminGuard, AdminActor } from "../common/admin.guard";
import { AuditLogService } from "./audit-log.service";

class ReplyDto {
  @IsString()
  text: string;
}

@Controller("admin/tickets")
@UseGuards(AdminGuard)
export class AdminTicketsController {
  constructor(private prisma: PrismaService, private auditLog: AuditLogService) {}

  @Get()
  async list() {
    return this.prisma.supportTicket.findMany({
      include: { user: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    return this.prisma.supportTicket.findUniqueOrThrow({
      where: { id },
      include: { user: true, messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  @Post(":id/reply")
  async reply(@Param("id") id: string, @Body() dto: ReplyDto, @AdminActor() actor: string) {
    const ticket = await this.prisma.supportTicket.findUniqueOrThrow({ where: { id } });

    await this.prisma.ticketMessage.create({
      data: { ticketId: id, sender: "AGENT", text: dto.text },
    });

    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: { status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status },
    });

    await this.auditLog.log(actor, "Replied to support ticket", id);
    return updated;
  }

  @Post(":id/resolve")
  async resolve(@Param("id") id: string, @AdminActor() actor: string) {
    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: { status: "RESOLVED" },
    });
    await this.auditLog.log(actor, "Resolved support ticket", id);
    return updated;
  }
}
