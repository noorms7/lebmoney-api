import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(actor: string, action: string, target: string) {
    return this.prisma.auditLogEntry.create({ data: { actor, action, target } });
  }

  async list() {
    return this.prisma.auditLogEntry.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  }
}
