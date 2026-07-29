import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization as string | undefined;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

    if (!token) throw new UnauthorizedException("Missing bearer token");

    try {
      const payload = await this.jwt.verifyAsync(token);
      request.user = { id: payload.sub, phone: payload.phone };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired session");
    }
  }
}

/** Usage: `@CurrentUser() userId: string` inside a guarded controller method. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user?.id as string;
});
