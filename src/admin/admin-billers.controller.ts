import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { IsString } from "class-validator";
import { PrismaService } from "../common/prisma.service";
import { AdminGuard, AdminActor } from "../common/admin.guard";
import { AuditLogService } from "./audit-log.service";

class CreateBillerDto {
  @IsString()
  name: string;

  @IsString()
  category: string;
}

@Controller("admin/billers")
@UseGuards(AdminGuard)
export class AdminBillersController {
  constructor(private prisma: PrismaService, private auditLog: AuditLogService) {}

  @Get()
  list() {
    return this.prisma.biller.findMany({ orderBy: { name: "asc" } });
  }

  @Post()
  async create(@Body() dto: CreateBillerDto, @AdminActor() actor: string) {
    const biller = await this.prisma.biller.create({ data: dto });
    await this.auditLog.log(actor, "Added biller", biller.name);
    return biller;
  }

  @Patch(":id/toggle")
  async toggle(@Param("id") id: string, @AdminActor() actor: string) {
    const biller = await this.prisma.biller.findUniqueOrThrow({ where: { id } });
    const updated = await this.prisma.biller.update({
      where: { id },
      data: { active: !biller.active },
    });
    await this.auditLog.log(actor, updated.active ? "Activated biller" : "Deactivated biller", updated.name);
    return updated;
  }
}
