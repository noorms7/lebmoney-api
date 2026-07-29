import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateProfile(userId: string, data: { name?: string; email?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }
}
