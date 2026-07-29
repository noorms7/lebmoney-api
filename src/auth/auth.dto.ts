import { IsString, Length, Matches } from "class-validator";

export class RequestOtpDto {
  @IsString()
  @Matches(/^\+?[0-9\s]{7,15}$/, { message: "Enter a valid phone number" })
  phone: string;
}

export class VerifyOtpDto {
  @IsString()
  phone: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
