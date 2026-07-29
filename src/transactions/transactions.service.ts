import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { LedgerService } from "../wallet/ledger.service";
import { Currency } from "../common/enums";
import { Prisma, CurrencyAccount, LedgerEntry, Transaction } from "@prisma/client";

const FLAT_FEE_USD = 1.5; // matches the mock fee shown in the mobile app's Send flow
const SYSTEM_FEE_HANDLE = "@system"; // created by prisma/seed.ts

/**
 * Phase 1 Move Money spec §2.2: fee is always shown before confirmation, and
 * here the fee itself is routed to a real platform-owned ledger account
 * rather than just vanishing from the sender's balance — so the whole
 * transaction still nets to zero across every account it touches, exactly
 * like the Wallet's ledger model requires (Phase 0 §4.3).
 */
@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService, private ledger: LedgerService) {}

  async sendMoney(senderId: string, recipientHandle: string, amount: number, currency: Currency) {
    const recipient = await this.prisma.user.findUnique({ where: { handle: recipientHandle } });
    if (!recipient) throw new NotFoundException("Recipient not found");
    if (recipient.id === senderId) throw new BadRequestException("Cannot send money to yourself");

    const systemAccount = await this.prisma.user.findUnique({ where: { handle: SYSTEM_FEE_HANDLE } });
    if (!systemAccount) {
      throw new BadRequestException(
        "Platform fee-revenue account is not seeded — run `npm run seed` first"
      );
    }

    const senderWallet = await this.prisma.wallet.findUniqueOrThrow({ where: { userId: senderId }, include: { currencyAccounts: true } });
    const recipientWallet = await this.prisma.wallet.findUniqueOrThrow({ where: { userId: recipient.id }, include: { currencyAccounts: true } });
    const systemWallet = await this.prisma.wallet.findUniqueOrThrow({ where: { userId: systemAccount.id }, include: { currencyAccounts: true } });

    const senderAccount = senderWallet.currencyAccounts.find((a: CurrencyAccount) => a.currency === currency);
    const systemFeeAccount = systemWallet.currencyAccounts.find((a: CurrencyAccount) => a.currency === currency);
    if (!senderAccount) throw new BadRequestException(`You don't hold a ${currency} balance`);
    if (!systemFeeAccount) throw new BadRequestException("Fee revenue account missing for this currency");

    let recipientAccount = recipientWallet.currencyAccounts.find((a: CurrencyAccount) => a.currency === currency);

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Auto-create the recipient's currency account if they don't hold one
      // yet (mirrors Wallet spec's "add a currency" flow, done implicitly
      // for a smoother demo receive experience).
      if (!recipientAccount) {
        recipientAccount = await tx.currencyAccount.create({
          data: { walletId: recipientWallet.id, currency, isPrimary: false },
        });
      }

      const transaction = await tx.transaction.create({
        data: {
          type: "SEND",
          status: "COMPLETED",
          counterpartyLabel: recipientHandle,
          originalCurrency: currency,
          originalAmount: amount,
          reportingCurrency: currency,
          convertedAmount: amount,
          exchangeRateAtTime: 1,
        },
      });

      await this.ledger.postEntries(tx, transaction.id, [
        { currencyAccountId: senderAccount.id, amount: -(amount + FLAT_FEE_USD) },
        { currencyAccountId: recipientAccount.id, amount },
        { currencyAccountId: systemFeeAccount.id, amount: FLAT_FEE_USD },
      ]);

      return transaction;
    });
  }

  async history(userId: string) {
    const wallet = await this.prisma.wallet.findUniqueOrThrow({
      where: { userId },
      include: { currencyAccounts: true },
    });
    const accountIds = wallet.currencyAccounts.map((a: CurrencyAccount) => a.id);

    const entries = await this.prisma.ledgerEntry.findMany({
      where: { currencyAccountId: { in: accountIds } },
      include: { transaction: true },
      orderBy: { createdAt: "desc" },
    });

    return entries.map((e: LedgerEntry & { transaction: Transaction }) => ({
      transactionId: e.transactionId,
      type: e.transaction.type,
      status: e.transaction.status,
      counterpartyLabel: e.transaction.counterpartyLabel,
      amount: e.amount,
      currency: e.transaction.originalCurrency,
      timestamp: e.createdAt,
    }));
  }
}
