import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, createParamDecorator } from "@nestjs/common";

/**
 * Placeholder only. Real admin auth needs the Roles & Permissions system
 * from the Screen Inventory's Admin Dashboard module (internal SSO, scoped
 * roles, audit-logged access) — this just checks a static header so the
 * admin endpoints aren't wide open in this mock. The admin's email is also
 * read from a header for audit-log attribution, standing in for what a real
 * session token would carry.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = request.headers["x-admin-key"];
    if (key !== (process.env.ADMIN_API_KEY ?? "dev-only-admin-key")) {
      throw new UnauthorizedException("Missing or invalid admin credentials");
    }
    request.adminEmail = request.headers["x-admin-email"] ?? "unknown-admin";
    return true;
  }
}

/** Usage: `@AdminActor() actorEmail: string` inside an AdminGuard-protected route. */
export const AdminActor = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.adminEmail as string;
});
