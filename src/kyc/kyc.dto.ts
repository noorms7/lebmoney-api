import { IsBoolean, IsIn } from "class-validator";
import { KycTier, KYC_TIERS } from "../common/enums";

export class SubmitKycDto {
  @IsIn(KYC_TIERS)
  tierRequested: KycTier;
}

export class ReviewKycDto {
  @IsBoolean()
  approve: boolean;
}
