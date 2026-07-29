import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { IsInt, IsOptional, IsString } from "class-validator";
import { PrismaService } from "../common/prisma.service";
import { AdminGuard, AdminActor } from "../common/admin.guard";
import { AuditLogService } from "./audit-log.service";

class CreatePerkDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsInt()
  cashbackPercent?: number;
}

@Controller("admin/perks")
@UseGuards(AdminGuard)
export class AdminPerksController {
  constructor(private prisma: PrismaService, private auditLog: AuditLogService) {}

  @Get()
  list() {
    return this.prisma.perk.findMany({ orderBy: { title: "asc" } });
  }

  @Post()
  async create(@Body() dto: CreatePerkDto, @AdminActor() actor: string) {
    const perk = await this.prisma.perk.create({ data: dto });
    await this.auditLog.log(actor, "Published perk", perk.title);
    return perk;
  }

  @Patch(":id/toggle")
  async toggle(@Param("id") id: string, @AdminActor() actor: string) {
    const perk = await this.prisma.perk.findUniqueOrThrow({ where: { id } });
    const updated = await this.prisma.perk.update({ where: { id }, data: { active: !perk.active } });
    await this.auditLog.log(actor, updated.active ? "Activated perk" : "Deactivated perk", updated.title);
    return updated;
  }
}
