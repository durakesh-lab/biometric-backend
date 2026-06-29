import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Mark a route (or controller) with the roles allowed to access it.
 * Use together with RolesGuard (which reads req.user.role from the JWT).
 *   @Roles('Super Admin', 'HR Admin')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
