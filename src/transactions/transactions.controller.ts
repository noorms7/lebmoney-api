import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { TransactionsService } from "./transactions.service";
import { SendMoneyDto } from "./transactions.dto";
import { JwtAuthGuard, CurrentUser } from "../auth/jwt-auth.guard";

@Controller("transactions")
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post("send")
  send(@CurrentUser() userId: string, @Body() dto: SendMoneyDto) {
    return this.transactionsService.sendMoney(userId, dto.recipientHandle, dto.amount, dto.currency);
  }

  @Get("history")
  history(@CurrentUser() userId: string) {
    return this.transactionsService.history(userId);
  }
}
