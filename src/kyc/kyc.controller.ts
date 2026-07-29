import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { KycService } from "./kyc.service";
import { SubmitKycDto, ReviewKycDto } from "./kyc.dto";
import { JwtAuthGuard, CurrentUser } from "../auth/jwt-auth.guard";
import { AdminGuard, AdminActor } from "../common/admin.guard";

@Controller("kyc")
export class KycController {
  constructor(private kycService: KycService) {}

  @Post("submit")
  @UseGuards(JwtAuthGuard)
  submit(@CurrentUser() userId: string, @Body() dto: SubmitKycDto) {
    return this.kycService.submitCase(userId, dto.tierRequested);
  }

  @Get("admin/pending")
  @UseGuards(AdminGuard)
  listPending() {
    return this.kycService.listPending();
  }

  @Post("admin/:id/review")
  @UseGuards(AdminGuard)
  review(@Param("id") id: string, @Body() dto: ReviewKycDto, @AdminActor() actor: string) {
    return this.kycService.review(id, dto.approve, actor);
  }
}
