import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { Prisma } from "@prisma/client";

export interface LedgerLine {
  currencyAccountId: string;
  /** Positive = credit (money in), negative = debit (money out). */
  amount: number;
}

const EPSILON = 0.0001;

/**
 * Every balance-affecting operation in the system goes through this service.
 * No other code writes to CurrencyAccount balances directly — the balance
 * is always derived from the sum of LedgerEntry rows, never a mutable field
 * (Phase 0 architecture decision §4.3: "immutable ledger entries, not just
 * balance fields").
 *
 * Known simplification (flagged, not hidden): fee revenue and FX suspense
 * accounts aren't modeled yet, so `postEntries` currently only supports
 * balanced transfers between existing CurrencyAccounts (lines must sum to
 * zero). Real fee handling needs a platform-owned revenue CurrencyAccount
 * per currency — next implementation step, not something to fake here.
 */
@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  async postEntries(tx: Prisma.TransactionClient, transactionId: string, lines: LedgerLine[]) {
    const sum = lines.reduce((acc, l) => acc + l.amount, 0);
    if (Math.abs(sum) > EPSILON) {
      throw new BadRequestException(
        `Ledger lines must sum to zero (got ${sum}) — refusing to post an unbalanced transaction`
      );
    }

    for (const line of lines) {
      const account = await tx.currencyAccount.findUniqueOrThrow({
        where: { id: line.currencyAccountId },
      });
      const currentBalance = await this.getBalance(tx, account.id);
      const nextBalance = currentBalance + line.amount;

      if (nextBalance < -EPSILON) {
        throw new BadRequestException("Insufficient balance");
      }

      await tx.ledgerEntry.create({
        data: {
          currencyAccountId: line.currencyAccountId,
          transactionId,
          amount: line.amount,
          balanceAfter: nextBalance,
        },
      });
    }
  }

  /** Balance is always the sum of ledger entries — never read from a stored field. */
  async getBalance(client: Prisma.TransactionClient | PrismaService, currencyAccountId: string) {
    const result = await client.ledgerEntry.aggregate({
      where: { currencyAccountId },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }
}
