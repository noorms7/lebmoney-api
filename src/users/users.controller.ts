import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./users.dto";
import { JwtAuthGuard, CurrentUser } from "../auth/jwt-auth.guard";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("me")
  me(@CurrentUser() userId: string) {
    return this.usersService.me(userId);
  }

  @Patch("me")
  updateProfile(@CurrentUser() userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }
}
