import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../common/admin.guard";
import { AuditLogService } from "./audit-log.service";

@Controller("admin/audit-log")
@UseGuards(AdminGuard)
export class AdminAuditLogController {
  constructor(private auditLog: AuditLogService) {}

  @Get()
  list() {
    return this.auditLog.list();
  }
}
