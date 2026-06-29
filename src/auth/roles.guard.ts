import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

/**
 * Enforces @Roles() server-side. Reads the role from req.user (set by JwtStrategy.validate).
 * Apply AFTER JwtAuthGuard so req.user exists:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('Super Admin','HR Admin')
 * Routes/controllers without @Roles() are allowed (auth still required by JwtAuthGuard).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true; // no role restriction

    const { user } = context.switchToHttp().getRequest();
    if (user && required.includes(user.role)) return true;

    throw new ForbiddenException('You do not have permission to perform this action');
  }
}
