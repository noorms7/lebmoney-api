import { IsIn, IsNumber, IsPositive, IsString } from "class-validator";
import { Currency, CURRENCIES } from "../common/enums";

export class SendMoneyDto {
  @IsString()
  recipientHandle: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsIn(CURRENCIES)
  currency: Currency;
}
