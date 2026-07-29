import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { KycTier } from "../common/enums";
import { AuditLogService } from "../admin/audit-log.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService, private auditLog: AuditLogService) {}

  /** Called from the mobile app's ID Scan → Liveness → submit step. */
  async submitCase(userId: string, tierRequested: KycTier) {
    return this.prisma.kycCase.create({
      data: { userId, tierRequested, status: "PENDING" },
    });
  }

  /** Backs the Admin Dashboard's KYC Review Queue (Screen Inventory §19). */
  async listPending() {
    return this.prisma.kycCase.findMany({
      where: { status: "PENDING" },
      include: { user: true },
      orderBy: { submittedAt: "asc" },
    });
  }

  async review(caseId: string, approve: boolean, actor: string) {
    const kycCase = await this.prisma.kycCase.findUnique({ where: { id: caseId } });
    if (!kycCase) throw new NotFoundException("KYC case not found");
    if (kycCase.status !== "PENDING") {
      throw new BadRequestException("This case has already been reviewed");
    }

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.kycCase.update({
        where: { id: caseId },
        data: {
          status: approve ? "APPROVED" : "REJECTED",
          reviewedAt: new Date(),
        },
      });

      if (approve) {
        // The tier actually changes here — this is what unlocks higher
        // limits and card issuance client-side (Phase 1 spec §2.2).
        await tx.user.update({
          where: { id: kycCase.userId },
          data: { kycTier: kycCase.tierRequested },
        });
      }

      return updated;
    });

    await this.auditLog.log(actor, approve ? "Approved KYC case" : "Rejected KYC case", caseId);
    return result;
  }
}
