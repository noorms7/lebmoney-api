import { Controller, Get, UseGuards } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { AdminGuard } from "../common/admin.guard";
import { Transaction } from "@prisma/client";

@Controller("admin/overview")
@UseGuards(AdminGuard)
export class AdminOverviewController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getOverview() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [activeUsers, todaysTransactions, openTickets, flaggedTransactions] = await Promise.all([
      this.prisma.user.count({ where: { status: "ACTIVE" } }),
      this.prisma.transaction.findMany({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.supportTicket.count({ where: { status: { not: "RESOLVED" } } }),
      this.prisma.transaction.count({ where: { flagged: true } }),
    ]);

    const volumeToday = todaysTransactions.reduce(
      (sum: number, t: Transaction) => sum + t.convertedAmount,
      0
    );

    return { activeUsers, volumeToday, openTickets, flaggedTransactions };
  }
}
