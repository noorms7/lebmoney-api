import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { LedgerService } from "./ledger.service";
import { Currency } from "../common/enums";
import { CurrencyAccount } from "@prisma/client";

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService, private ledger: LedgerService) {}

  async createWalletForUser(userId: string, primaryCurrency: Currency = "USD") {
    return this.prisma.wallet.create({
      data: {
        userId,
        currencyAccounts: {
          create: [{ currency: primaryCurrency, isPrimary: true }],
        },
      },
      include: { currencyAccounts: true },
    });
  }

  async addCurrency(userId: string, currency: Currency) {
    const wallet = await this.getWalletOrThrow(userId);
    return this.prisma.currencyAccount.create({
      data: { walletId: wallet.id, currency, isPrimary: false },
    });
  }

  async getBalances(userId: string) {
    const wallet = await this.getWalletOrThrow(userId);
    const balances = await Promise.all(
      wallet.currencyAccounts.map(async (acct: CurrencyAccount) => ({
        currency: acct.currency,
        isPrimary: acct.isPrimary,
        amount: await this.ledger.getBalance(this.prisma, acct.id),
      }))
    );
    return balances;
  }

  async getWalletOrThrow(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { currencyAccounts: true },
    });
    if (!wallet) throw new NotFoundException("Wallet not found for user");
    return wallet;
  }

  async findAccount(userId: string, currency: Currency) {
    const wallet = await this.getWalletOrThrow(userId);
    const account = wallet.currencyAccounts.find((a: CurrencyAccount) => a.currency === currency);
    if (!account) throw new NotFoundException(`User has no ${currency} account`);
    return account;
  }
}
