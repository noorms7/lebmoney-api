import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { IsIn } from "class-validator";
import { Currency, CURRENCIES } from "../common/enums";
import { WalletService } from "./wallet.service";
import { JwtAuthGuard, CurrentUser } from "../auth/jwt-auth.guard";

class AddCurrencyDto {
  @IsIn(CURRENCIES)
  currency: Currency;
}

@Controller("wallet")
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get("balances")
  getBalances(@CurrentUser() userId: string) {
    return this.walletService.getBalances(userId);
  }

  @Post("currencies")
  addCurrency(@CurrentUser() userId: string, @Body() dto: AddCurrencyDto) {
    return this.walletService.addCurrency(userId, dto.currency);
  }
}
