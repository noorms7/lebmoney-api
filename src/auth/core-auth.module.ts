import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Global()
@Module({
  imports: [
    JwtModule.register({
      // Dev-only secret. Production reads this from a secrets manager, never
      // a hardcoded string committed to the repo.
      secret: process.env.JWT_SECRET ?? "dev-only-insecure-secret-change-me",
      signOptions: { expiresIn: "15m" },
    }),
  ],
  providers: [JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard],
})
export class CoreAuthModule {}
