import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../common/prisma.service";
import { WalletService } from "../wallet/wallet.service";

const MOCK_OTP_CODE = "123456"; // stand-in until a real SMS provider is wired up
const otpStore = new Map<string, string>(); // phone -> code, in-memory for this mock

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private wallet: WalletService
  ) {}

  /** Real implementation calls an SMS provider; this logs the mock code instead. */
  async requestOtp(phone: string) {
    otpStore.set(phone, MOCK_OTP_CODE);
    // eslint-disable-next-line no-console
    console.log(`[mock SMS] OTP for ${phone}: ${MOCK_OTP_CODE}`);
    return { sent: true };
  }

  async verifyOtp(phone: string, code: string) {
    const expected = otpStore.get(phone);
    if (!expected || expected !== code) {
      throw new UnauthorizedException("Incorrect or expired code");
    }
    otpStore.delete(phone);

    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      // First-time signup: Tier 0 wallet created immediately, per the
      // progressive-KYC decision (Phase 1 Onboarding spec §2.1).
      user = await this.prisma.user.create({
        data: { phone, handle: `@user${Date.now().toString().slice(-6)}` },
      });
      await this.wallet.createWalletForUser(user.id);
    }

    const accessToken = await this.jwt.signAsync({ sub: user.id, phone: user.phone });
    return { accessToken, user };
  }

  async verifyToken(token: string) {
    try {
      return await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException("Invalid or expired session");
    }
  }
}
