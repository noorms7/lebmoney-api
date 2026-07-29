import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { IsEmail, IsIn } from "class-validator";
import { PrismaService } from "../common/prisma.service";
import { AdminGuard, AdminActor } from "../common/admin.guard";
import { AuditLogService } from "./audit-log.service";
import { AdminRole, ADMIN_ROLES } from "../common/enums";

class InviteDto {
  @IsEmail()
  email: string;
}

class ChangeRoleDto {
  @IsIn(ADMIN_ROLES)
  role: AdminRole;
}

@Controller("admin/roles")
@UseGuards(AdminGuard)
export class AdminRolesController {
  constructor(private prisma: PrismaService, private auditLog: AuditLogService) {}

  @Get()
  list() {
    return this.prisma.adminAccount.findMany({ orderBy: { email: "asc" } });
  }

  @Post()
  async invite(@Body() dto: InviteDto, @AdminActor() actor: string) {
    const account = await this.prisma.adminAccount.create({
      data: { email: dto.email, role: "SUPPORT_AGENT" },
    });
    await this.auditLog.log(actor, "Invited teammate", account.email);
    return account;
  }

  @Patch(":id")
  async changeRole(@Param("id") id: string, @Body() dto: ChangeRoleDto, @AdminActor() actor: string) {
    const account = await this.prisma.adminAccount.update({ where: { id }, data: { role: dto.role } });
    await this.auditLog.log(actor, `Changed role to ${dto.role}`, account.email);
    return account;
  }
}
